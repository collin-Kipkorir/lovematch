import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || 18,
    bio: user?.bio || '',
    location: user?.location || '',
    interests: user?.interests || [],
    profileImage: user?.profileImage || ''
  });
  
  const [newInterest, setNewInterest] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(user?.profileImage || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const lastFileRef = useRef<File | null>(null);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!updateUser) return;
    setSaving(true);
    try {
      // Only send the form fields to avoid non-serializable values coming from `user` (eg CryptoKey)
      await updateUser({ ...formData });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated!'
      });
      onClose();
    } catch (err) {
      console.error('Failed to save profile', err);
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  const uploadToStorage = (file: File, filename: string, onProgress: (pct: number) => void) => {
    return new Promise<string>((resolve, reject) => {
      const sRef = storageRef(storage, filename);
      const task = uploadBytesResumable(sRef, file);
      task.on('state_changed', snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(pct);
      }, error => {
        reject(error);
      }, async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        } catch (e) {
          reject(e);
        }
      });
    });
  };

  const handleImageFile = async (file?: File) => {
    if (!file) return;
    lastFileRef.current = file;
    setUploadError(null);

    // show local preview immediately
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      // ignore preview errors
    }

    if (!user) return;
    const previousImageUrl = user.profileImage || null;

    setUploading(true);
    setUploadProgress(0);

    const maxAttempts = 3;
    let attempt = 0;
  let lastError: unknown = null;
    try {
      while (attempt < maxAttempts) {
        attempt += 1;
        try {
          const filename = `profileImages/${user.id}_${Date.now()}`;
          const url = await uploadToStorage(file, filename, (pct) => setUploadProgress(pct));

          // Update preview and form data
          setImagePreview(url);
          setFormData(prev => ({ ...prev, profileImage: url }));

          // Attempt to delete previous image (best-effort, don't block)
          try {
            if (previousImageUrl && previousImageUrl !== url && previousImageUrl.includes('firebasestorage.googleapis.com')) {
              const oIndex = previousImageUrl.indexOf('/o/');
              if (oIndex !== -1) {
                const afterO = previousImageUrl.substring(oIndex + 3);
                const qIndex = afterO.indexOf('?');
                const encodedPath = qIndex === -1 ? afterO : afterO.substring(0, qIndex);
                const storagePath = decodeURIComponent(encodedPath);
                const prevRef = storageRef(storage, storagePath);
                await deleteObject(prevRef).catch(err => console.warn('Failed to delete previous profile image from storage:', err));
              }
            }
          } catch (e) {
            console.warn('Error while attempting to delete previous profile image:', e);
          }

          lastError = null;
          break; // success
        } catch (err) {
          lastError = err;
          console.warn(`Upload attempt ${attempt} failed:`, err);
          // If not last attempt, wait with exponential backoff
          if (attempt < maxAttempts) {
            const backoff = 500 * Math.pow(2, attempt - 1);
            await sleep(backoff);
            continue;
          }
          // otherwise rethrow
          throw err;
        }
      }
    } catch (err) {
      console.error('Image upload failed', err);
      setUploadError(err?.message || 'Upload failed');
      toast({ title: 'Error', description: 'Failed to upload image. Please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Profile Image</Label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-xs text-muted-foreground">No image</div>
                )}
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Image URL"
                  value={formData.profileImage}
                  onChange={(e) => { setFormData(prev => ({ ...prev, profileImage: e.target.value })); setImagePreview(e.target.value || null); }}
                />
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload profile image"
                  onChange={(e) => handleImageFile(e.target.files?.[0])}
                  className="mt-2"
                />
                {uploadProgress !== null && (
                  <div className="w-full bg-muted/30 rounded h-2 mt-2">
                    <div className={`h-2 bg-primary rounded w-[${uploadProgress}%]`} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>

          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              min="18"
              max="100"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 18 }))}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Your location"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div>
            <Label>Interests</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest"
                onKeyPress={(e) => e.key === 'Enter' && addInterest()}
              />
              <Button onClick={addInterest} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 hover:bg-transparent"
                    onClick={() => removeInterest(interest)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-gradient-primary" disabled={uploading || saving}>
              {uploading ? `Uploading... ${uploadProgress ?? ''}%` : saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;