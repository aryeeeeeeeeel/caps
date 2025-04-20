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
  IonToolbar 
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { bookOutline, search, star } from 'ionicons/icons';
import { Route, Redirect } from 'react-router-dom';

import Inventory from './home-tabs/Inventory';
import Product from './home-tabs/Product';
import Search from './home-tabs/Search';

const Home: React.FC = () => {
  const tabs = [
    {name:'Product', tab:'product', url: '/TRA-Manolo-Fortich/app/home/product', icon: bookOutline},
    {name:'Search', tab:'search', url: '/TRA-Manolo-Fortich/app/home/search', icon: search},
    {name:'Inventory', tab:'inventory', url: '/TRA-Manolo-Fortich/app/home/inventory', icon: star},
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/TRA-Manolo-Fortich/app/home/product" component={Product} />
              <Route exact path="/TRA-Manolo-Fortich/app/home/search" component={Search} />
              <Route exact path="/TRA-Manolo-Fortich/app/home/inventory" component={Inventory} />
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