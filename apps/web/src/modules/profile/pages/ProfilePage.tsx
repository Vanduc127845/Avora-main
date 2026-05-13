import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../components/ui';
import { User, Mail, Edit2 } from 'lucide-react';
import { useAuthStore } from '../../../store';
import { DISABILITY_TYPES, SEVERITY_LEVELS } from '../../../lib/shared';

export default function ProfilePage({ editMode: initialEditMode = false }: { editMode?: boolean }) {
  const { user } = useAuthStore();
  const [editMode, setEditMode] = React.useState(initialEditMode);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-2">Your Profile</h1>
        <Button
          variant="outline"
          leftIcon={<Edit2 className="h-4 w-4" />}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'User Name'}</h2>
              <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                  Active
                </span>
                <span className="text-sm text-gray-500">Member since April 2026</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{user?.name || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user?.email || 'Not set'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disability Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Disability & Accessibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="label">Primary Disability Type</label>
                <select
                  className="input"
                  value={user?.disabilityProfile?.primaryType || ''}
                  disabled={!editMode}
                >
                  <option value="">Select...</option>
                  {DISABILITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Severity Level</label>
                <select
                  className="input"
                  value={user?.disabilityProfile?.severity || ''}
                  disabled={!editMode}
                >
                  <option value="">Select...</option>
                  {SEVERITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Disclosure Level</label>
              <div className="flex gap-4">
                {['public', 'connections', 'private'].map((level) => (
                  <label key={level} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="disclosure"
                      value={level}
                      checked={user?.disabilityProfile?.disclosureLevel === level}
                      disabled={!editMode}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-gray-700 capitalize">{level}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Control who can see your disability information
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Career Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="label">Experience Level</label>
                <select className="input" disabled={!editMode}>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <div>
                <label className="label">Work Preference</label>
                <select className="input" disabled={!editMode}>
                  <option value="remote">Remote Only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Target Roles</label>
              <div className="flex flex-wrap gap-2">
                {['Software Developer', 'UX Designer', 'Data Analyst'].map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {role}
                  </span>
                ))}
                {editMode && (
                  <button className="px-3 py-1 border border-dashed border-gray-300 text-gray-500 rounded-full text-sm hover:border-primary-500 hover:text-primary-600">
                    + Add role
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {editMode && (
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
          <Button>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
