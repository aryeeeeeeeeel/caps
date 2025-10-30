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

/* Dark mode disabled - using consistent color scheme */
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

/* Main Pages */
import LandingPage from "./pages/Landingpage";
import Profile from './pages/user-tabs/Profile';

/* Admin Pages */
import AdminDashboard from './pages/admin-tabs/AdminDashboard';
import AdminNotifications from './pages/admin-tabs/AdminNotifications';
import AdminAnalytics from './pages/admin-tabs/AdminAnalytics';
import AdminIncidents from './pages/admin-tabs/AdminIncidents';
import AdminUsers from './pages/admin-tabs/AdminUsers';
import SystemLogs from './pages/admin-tabs/SystemLogs';
import ActivityLogs from './pages/user-tabs/ActivityLogs';
import AdminLogin from './pages/admin-tabs/AdminLogin';
import Dashboard from './pages/user-tabs/Dashboard';
import IncidentReport from './pages/user-tabs/IncidentReport';
import IncidentMap from './pages/user-tabs/IncidentMap';
import Notifications from './pages/user-tabs/Notifications';
import History from './pages/user-tabs/History';
import GiveFeedback from './pages/user-tabs/GiveFeedback';
import Login from './pages/user-tabs/Login';
import Register from './pages/user-tabs/Register';

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

        {/* User App Routes - Using Home component with bottom tabs */}
        <Route exact path="/it35-lab2/app" render={() => {
          return <Redirect to="/it35-lab2/app/dashboard" />;
        }} />
        <Route exact path="/it35-lab2/app/dashboard" component={Dashboard} />
        <Route exact path="/it35-lab2/app/submit" component={IncidentReport} />
        <Route exact path="/it35-lab2/app/map" component={IncidentMap} />
        <Route exact path="/it35-lab2/app/history" component={History} />
        <Route exact path="/it35-lab2/app/notifications" component={Notifications} />
        <Route exact path="/it35-lab2/app/feedback" component={GiveFeedback} />
        <Route exact path="/it35-lab2/app/activity-logs" component={ActivityLogs} />
        <Route exact path="/it35-lab2/app/profile" component={Profile} />

        {/* Admin Dashboard Routes */}
        <Route exact path="/it35-lab2/admin-dashboard" component={AdminDashboard} />
        <Route exact path="/it35-lab2/admin/system-logs" component={SystemLogs} />
        <Route exact path="/it35-lab2/admin/notifications" component={AdminNotifications} />
        <Route exact path="/it35-lab2/admin/analytics" component={AdminAnalytics} />
        <Route exact path="/it35-lab2/admin/incidents" component={AdminIncidents} />
        <Route exact path="/it35-lab2/admin/users" component={AdminUsers} />

        {/* Default redirect */}
        <Route exact path="/" render={() => <Redirect to="/it35-lab2" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;