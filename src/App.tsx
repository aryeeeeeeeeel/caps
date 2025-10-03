import { Route, Redirect } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Dark mode (system default) */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

/* Main Pages */
import Login from './pages/Login';
import LandingPage from "./pages/Landingpage";
import AdminLogin from "./pages/AdminLogin";
import Register from './pages/Register';
import Profile from './pages/Profile';

/* Admin Pages */
import AdminDashboard from './pages/admin-tabs/AdminDashboard';
import AdminReports from './pages/admin-tabs/AdminReports';
import AdminMap from './pages/admin-tabs/AdminMap';
import AdminUsers from './pages/admin-tabs/AdminUsers';
import AdminSettings from './pages/admin-tabs/AdminSettings';
import AdminAnalytics from './pages/admin-tabs/AdminAnalytics';
import Home from './pages/Home';

setupIonicReact();
defineCustomElements(window);

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Landing and Auth Routes */}
        <Route exact path="/it35-lab2" component={LandingPage} />
        <Route exact path="/it35-lab2/user-login" component={Login} />
        <Route exact path="/it35-lab2/admin-login" component={AdminLogin} />
        <Route exact path="/it35-lab2/register" component={Register} />

        {/* User App Routes - Direct routing without nested Home component */}
        <Route exact path="/it35-lab2/app" render={() => {
          return <Redirect to="/it35-lab2/app/dashboard" />;
        }} />
        {/* User App Routes - Using Home component with bottom tabs */}
        <Route exact path="/it35-lab2/app" component={Home} />
        <Route exact path="/it35-lab2/app/dashboard" component={Home} />
        <Route exact path="/it35-lab2/app/submit" component={Home} />
        <Route exact path="/it35-lab2/app/map" component={Home} />
        <Route exact path="/it35-lab2/app/reports" component={Home} />
        <Route exact path="/it35-lab2/app/notifications" component={Home} />
        <Route exact path="/it35-lab2/app/feedback" component={Home} />
        <Route exact path="/it35-lab2/app/profile" component={Profile} />

        {/* Report detail routes */}
        <Route exact path="/it35-lab2/app/reports/:id" component={Home} />

        {/* Admin Dashboard Routes */}
        <Route exact path="/it35-lab2/admin-dashboard" component={AdminDashboard} />
        <Route exact path="/it35-lab2/admin/reports" component={AdminReports} />
        <Route exact path="/it35-lab2/admin/map" component={AdminMap} />
        <Route exact path="/it35-lab2/admin/users" component={AdminUsers} />
        <Route exact path="/it35-lab2/admin/analytics" component={AdminAnalytics} />
        <Route exact path="/it35-lab2/admin/settings" component={AdminSettings} />
        <Route exact path="/it35-lab2/admin/reports/:id" component={AdminReports} />

        {/* Default redirect */}
        <Route exact path="/" render={() => <Redirect to="/it35-lab2" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;