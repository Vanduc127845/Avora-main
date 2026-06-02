import { Router } from 'express';
import { Resend } from 'resend';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import {
  createId,
  demoPartnerInquiries,
  type DemoPartnerInquiry,
} from '../data/demo-store.js';
import { saveDemoData } from '../data/demo-persistence.js';
import { getOptionalSupabaseAdmin } from '../utils/supabase.js';

export const partnersRouter: Router = Router();
const deferredPartnerMessage = 'Sẽ liên hệ trong 24h';

const partnerSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  companySize: z.string().optional(),
  partnershipType: z.string().min(1, 'Partnership type is required'),
  message: z.string().optional(),
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const persistPartnerInquiry = async (
  data: z.infer<typeof partnerSchema>,
  partnershipType: string
): Promise<DemoPartnerInquiry> => {
  const timestamp = new Date().toISOString();
  const inquiry: DemoPartnerInquiry = {
    id: createId('partner'),
    organizationName: data.organizationName,
    contactPerson: data.contactPerson,
    email: data.email,
    phone: data.phone,
    website: data.website,
    companySize: data.companySize,
    partnershipType,
    message: data.message,
    emailDelivery: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const supabase = getOptionalSupabaseAdmin();

  if (supabase) {
    const { error } = await supabase.from('partner_inquiries').insert({
      id: inquiry.id,
      organization_name: inquiry.organizationName,
      contact_person: inquiry.contactPerson,
      email: inquiry.email,
      phone: inquiry.phone || null,
      website: inquiry.website || null,
      company_size: inquiry.companySize || null,
      partnership_type: inquiry.partnershipType,
      message: inquiry.message || null,
      email_delivery: inquiry.emailDelivery,
      created_at: inquiry.createdAt,
      updated_at: inquiry.updatedAt,
    });
    if (error) throw error;
    return inquiry;
  }

  demoPartnerInquiries.set(inquiry.id, inquiry);
  await saveDemoData();
  return inquiry;
};

const updatePartnerDelivery = async (
  inquiry: DemoPartnerInquiry,
  emailDelivery: DemoPartnerInquiry['emailDelivery']
) => {
  const updatedAt = new Date().toISOString();
  const supabase = getOptionalSupabaseAdmin();

  if (supabase) {
    const { error } = await supabase
      .from('partner_inquiries')
      .update({ email_delivery: emailDelivery, updated_at: updatedAt })
      .eq('id', inquiry.id);
    if (error) logger.warn('partner-inquiry-delivery-status-update-failed', { error });
    return;
  }

  demoPartnerInquiries.set(inquiry.id, { ...inquiry, emailDelivery, updatedAt });
  await saveDemoData();
};

partnersRouter.post('/partner-inquiry', async (req, res) => {
  try {
    const data = partnerSchema.parse(req.body);

    const partnershipTypeLabels: Record<string, string> = {
      employer: 'Inclusive Employer',
      ngo: 'NGO Partner',
      education: 'Educational Institution',
      technology: 'Technology Partner',
    };

    const partnershipType = partnershipTypeLabels[data.partnershipType] || data.partnershipType;
    const inquiry = await persistPartnerInquiry(data, partnershipType);
    const safe = {
      organizationName: escapeHtml(data.organizationName),
      contactPerson: escapeHtml(data.contactPerson),
      email: escapeHtml(data.email),
      phone: data.phone ? escapeHtml(data.phone) : '',
      website: data.website ? escapeHtml(data.website) : '',
      companySize: data.companySize ? escapeHtml(data.companySize) : '',
      partnershipType: escapeHtml(partnershipType),
      message: data.message ? escapeHtml(data.message) : '',
    };

    if (!process.env.RESEND_API_KEY) {
      logger.warn('partner-inquiry-email-skipped', {
        organizationName: data.organizationName,
        partnershipType,
        email: data.email,
      });
      await updatePartnerDelivery(inquiry, 'skipped');

      res.status(202).json({
        success: true,
        delivery: 'skipped',
        message: deferredPartnerMessage,
      });
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
    .field { margin-bottom: 16px; padding: 16px; background: white; border-radius: 8px; border-left: 4px solid #0ea5e9; }
    .label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
    .value { color: #1e293b; font-size: 16px; }
    .message-box { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">New Partnership Inquiry</h1>
      <p style="margin: 8px 0 0;">Avora - AI Career Copilot for Disabled</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Organization</div>
        <div class="value">${safe.organizationName}</div>
      </div>
      <div class="field">
        <div class="label">Contact Person</div>
        <div class="value">${safe.contactPerson}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${safe.email}">${safe.email}</a></div>
      </div>
      ${data.phone ? `
      <div class="field">
        <div class="label">Phone</div>
        <div class="value">${safe.phone}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="label">Partnership Type</div>
        <div class="value">${safe.partnershipType}</div>
      </div>
      ${data.companySize ? `
      <div class="field">
        <div class="label">Company Size</div>
        <div class="value">${safe.companySize} employees</div>
      </div>
      ` : ''}
      ${data.website ? `
      <div class="field">
        <div class="label">Website</div>
        <div class="value"><a href="${safe.website}">${safe.website}</a></div>
      </div>
      ` : ''}
      ${data.message ? `
      <div class="message-box">
        <div class="label">Message</div>
        <div class="value" style="white-space: pre-wrap;">${safe.message}</div>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>This inquiry was submitted through the Avora website.</p>
      <p>Received at: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })} (Vietnam Time)</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const result = await resend.emails.send({
        from: 'Avora Partners <onboarding@resend.dev>',
        to: process.env.PARTNER_EMAIL_TO || 'homiepc2019@gmail.com',
        subject: `New Partnership Inquiry: ${data.organizationName} - ${partnershipType}`,
        html: emailContent,
        replyTo: data.email,
      });
      if (result.error) throw result.error;
      await updatePartnerDelivery(inquiry, 'sent');

      res.status(200).json({
        success: true,
        delivery: 'sent',
        message: 'Partner inquiry submitted successfully',
      });
    } catch (error) {
      logger.warn('partner-inquiry-email-failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      await updatePartnerDelivery(inquiry, 'deferred');
      res.status(202).json({
        success: true,
        delivery: 'deferred',
        message: deferredPartnerMessage,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      logger.error('partner-inquiry-error', { error });
      res.status(500).json({ error: 'Failed to submit partner inquiry' });
    }
  }
});
