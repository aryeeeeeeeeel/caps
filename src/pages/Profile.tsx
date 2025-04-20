import { 
    IonPage, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonAvatar,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonBackButton,
    IonButtons,
    IonToast,
    IonLoading
  } from '@ionic/react';
  import { useState, useEffect, useRef } from 'react';
  import { supabase } from '../utils/supabaseClient';
  import { camera } from 'ionicons/icons';
  import { useHistory } from 'react-router-dom';
  
  const Profile: React.FC = () => {
    const history = useHistory();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
  
    useEffect(() => {
      const fetchUserData = async () => {
        setIsLoading(true);
        try {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            history.push('/login');
            return;
          }
          setUser(user);
  
          // Get profile data
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
  
          if (error) throw error;
          
          if (profile) {
            setProfile(profile);
            setFullName(profile.full_name || '');
            setAvatarUrl(profile.avatar_url || '');
          }
        } catch (error: any) {
          setToastMessage(error.message || 'Failed to load profile');
          setShowToast(true);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchUserData();
    }, [history]);
  
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
      
        setIsLoading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`; // Unique filename
        const filePath = `${fileName}`;
      
        try {
          // 1. Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('avatars') // Your bucket name
            .upload(filePath, file);
      
          if (uploadError) throw uploadError;
      
          // 2. Get Public URL
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
      
          // 3. Save URL to Profiles Table
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);
      
          if (updateError) throw updateError;
      
          setAvatarUrl(publicUrl);
          setToastMessage('Profile picture updated!');
          setShowToast(true);
        } catch (error) {
          setToastMessage('Failed to upload image.');
          setShowToast(true);
        } finally {
          setIsLoading(false);
        }
      };
  
    const handleUpdateProfile = async () => {
      if (!fullName) {
        setToastMessage('Please enter your full name');
        setShowToast(true);
        return;
      }
  
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            full_name: fullName,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
  
        if (error) throw error;
  
        setToastMessage('Profile updated successfully');
        setShowToast(true);
      } catch (error: any) {
        setToastMessage(error.message || 'Failed to update profile');
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/TRA-Manolo-Fortich/app/home" />
            </IonButtons>
            <IonTitle>My Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <IonAvatar 
              style={{ 
                width: '120px', 
                height: '120px', 
                margin: '0 auto',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f4f5f8'
                }}>
                  <IonLabel>Add Photo</IonLabel>
                </div>
              )}
            </IonAvatar>
            <IonButton 
              fill="clear" 
              onClick={() => fileInputRef.current?.click()}
              style={{ marginTop: '10px' }}
            >
              {avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </IonButton>
          </div>
  
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput 
              value={user?.email || ''} 
              readonly 
            />
          </IonItem>
  
          <IonItem>
            <IonLabel position="stacked">Full Name</IonLabel>
            <IonInput 
              value={fullName} 
              onIonChange={(e) => setFullName(e.detail.value!)} 
              placeholder="Enter your full name"
            />
          </IonItem>
  
          <IonButton 
            expand="block" 
            onClick={handleUpdateProfile}
            style={{ marginTop: '20px' }}
          >
            Update Profile
          </IonButton>
  
          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMessage}
            duration={3000}
          />
  
          <IonLoading isOpen={isLoading} message="Please wait..." />
        </IonContent>
      </IonPage>
    );
  };
  
  export default Profile;