import { 
  IonButton,
  IonButtons,
  IonContent, 
  IonHeader,
  IonIcon, 
  IonLabel, 
  IonMenuButton, 
  IonPage,
  IonRouterOutlet, 
  IonTabBar, 
  IonTabButton, 
  IonTabs,  
  IonTitle, 
  IonToolbar,
  IonAvatar,
  IonItem,
  IonPopover
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { bookOutline, search, star, personCircle } from 'ionicons/icons';
import { Route, Redirect } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

import Inventory from './home-tabs/Inventory';
import Product from './home-tabs/Product';
import Search from './home-tabs/Search';

const Home: React.FC = () => {
  const tabs = [
    {name:'Product', tab:'product', url: '/TRA-Manolo-Fortich/app/home/product', icon: bookOutline},
    {name:'Search', tab:'search', url: '/TRA-Manolo-Fortich/app/home/search', icon: search},
    {name:'Inventory', tab:'inventory', url: '/TRA-Manolo-Fortich/app/home/inventory', icon: star},
  ];

  const [user, setUser] = useState<any>(null);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);

  useEffect(() => {
    // Get the current user session
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Optionally fetch additional user data from your profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!error && profile) {
          setUser((prev: any) => ({ ...prev, profile }));
        }
      }
    };

    fetchUser();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowProfilePopover(false);
  };

  const openProfilePopover = (e: any) => {
    setPopoverEvent(e);
    setShowProfilePopover(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Home</IonTitle>
          <IonButtons slot="end">
            {user ? (
              <IonButton onClick={openProfilePopover}>
                {user.user_metadata?.avatar_url ? (
                  <IonAvatar slot="icon-only" style={{ width: '32px', height: '32px' }}>
                    <img src={user.user_metadata.avatar_url} alt="Profile" />
                  </IonAvatar>
                ) : (
                  <IonIcon icon={personCircle} slot="icon-only" size="large" />
                )}
              </IonButton>
            ) : (
              <IonButton routerLink="/login">Login</IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonPopover
        isOpen={showProfilePopover}
        event={popoverEvent}
        onDidDismiss={() => setShowProfilePopover(false)}
      >
        <IonContent className="ion-padding">
          {user && (
            <div style={{ textAlign: 'center' }}>
              {user.user_metadata?.avatar_url ? (
                <IonAvatar style={{ width: '80px', height: '80px', margin: '0 auto' }}>
                  <img src={user.user_metadata.avatar_url} alt="Profile" />
                </IonAvatar>
              ) : (
                <IonIcon icon={personCircle} size="large" style={{ fontSize: '80px' }} />
              )}
              
              <h2>{user.email}</h2>
              <p>{user.user_metadata?.full_name || 'User'}</p>
              
              <IonButton 
               expand="block" 
               fill="clear" 
               routerLink="/TRA-Manolo-Fortich/app/profile"
               onClick={() => setShowProfilePopover(false)}
              >
               View Profile
              </IonButton>
              
              <IonButton 
                expand="block" 
                fill="clear" 
                color="danger" 
                onClick={handleSignOut}
              >
                Sign Out
              </IonButton>
            </div>
          )}
        </IonContent>
      </IonPopover>

      <IonContent fullscreen>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/TRA-Manolo-Fortich/app/home/product" component={Product} />
              <Route exact path="/TRA-Manolo-Fortich/app/home/search" component={Search} />
              <Route exact path="/TRA-Manolo-Fortich/app/home/inventory" component={Inventory} />
              <Route exact path="/TRA-Manolo-Fortich/app/home/inventory/:id" component={Inventory} />
              <Route exact path="/TRA-Manolo-Fortich/app/home">
                <Redirect to="/TRA-Manolo-Fortich/app/home/product" />
              </Route>
            </IonRouterOutlet>

            <IonTabBar slot="bottom">
              {tabs.map((item, index) => (
                <IonTabButton key={index} tab={item.tab} href={item.url}>
                  <IonIcon icon={item.icon} />
                  <IonLabel>{item.name}</IonLabel>
                </IonTabButton>
              ))}
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
      </IonContent>
    </IonPage>
  );
};

export default Home;