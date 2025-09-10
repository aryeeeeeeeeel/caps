import { Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

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
import Menu from './pages/Menu';
import AdminLogin from "./pages/Adminlogin";
import AdminDashboard from './pages/AdminDashboard';
import Register from './pages/Register';
import Profile from './pages/Profile';

/* User Dashboard Pages */
import Home from './pages/Home';
import Dashboard from './pages/home-tabs/Dashboard';
import SubmitHazards from './pages/home-tabs/SubmitHazards';
import ViewHazardMap from './pages/home-tabs/ViewHazardMap';
import MyReports from './pages/home-tabs/MyReports';
import Notifications from './pages/home-tabs/Notifications';
import GiveFeedback from './pages/home-tabs/GiveFeedback';

/* Admin Pages */
import AdminReports from './pages/admin-tabs/AdminReports';
import AdminMap from './pages/admin-tabs/AdminMap';
import AdminUsers from './pages/admin-tabs/AdminUsers';
import AdminSettings from './pages/admin-tabs/AdminSettings';
import AdminAnalytics from './pages/admin-tabs/AdminAnalytics';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Landing and Auth Routes */}
        <Route exact path="/it35-lab2" component={LandingPage} />
        <Route exact path="/it35-lab2/user-login" component={Login} />
        <Route exact path="/it35-lab2/admin-login" component={AdminLogin} />
        <Route exact path="/it35-lab2/register" component={Register} />
        
        {/* User App Routes */}
        <Route path="/it35-lab2/app" component={Menu} />
        <Route exact path="/it35-lab2/app/profile" component={Profile} />
        
        {/* User Dashboard Routes (Nested in Home component) */}
        <Route path="/it35-lab2/app/home" component={Home} />
        
        {/* Individual Tab Routes (for direct access) */}
        <Route exact path="/it35-lab2/app/dashboard" component={Dashboard} />
        <Route exact path="/it35-lab2/app/submit-hazard" component={SubmitHazards} />
        <Route exact path="/it35-lab2/app/hazard-map" component={ViewHazardMap} />
        <Route exact path="/it35-lab2/app/my-reports" component={MyReports} />
        <Route exact path="/it35-lab2/app/notifications" component={Notifications} />
        <Route exact path="/it35-lab2/app/feedback" component={GiveFeedback} />
        
        {/* Admin Dashboard Routes */}
        <Route exact path="/it35-lab2/admin-dashboard" component={AdminDashboard} />
        <Route exact path="/it35-lab2/admin/reports" component={AdminReports} />
        <Route exact path="/it35-lab2/admin/map" component={AdminMap} />
        <Route exact path="/it35-lab2/admin/users" component={AdminUsers} />
        <Route exact path="/it35-lab2/admin/analytics" component={AdminAnalytics} />
        <Route exact path="/it35-lab2/admin/settings" component={AdminSettings} />
        
        {/* Report Detail Routes */}
        <Route exact path="/it35-lab2/app/reports/:id" component={MyReports} />
        <Route exact path="/it35-lab2/admin/reports/:id" component={AdminReports} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;