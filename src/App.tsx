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

/* ✅ Fixed imports: case-sensitive */
import Login from './pages/Login';
import LandingPage from "./pages/Landingpage";
import Menu from './pages/Menu';
import AdminLogin from "./pages/Adminlogin";
import AdminDashboard from './pages/AdminDashboard';
import Register from './pages/Register';
import Profile from './pages/Profile';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* ✅ Changed path to lowercase and root route */}
        <Route exact path="/it35-lab2" component={LandingPage} />
        <Route path="/it35-lab2/user-login" component={Login} />
        <Route path="/it35-lab2/admin-login" component={AdminLogin} />
        <Route exact path="/it35-lab2/admin-dashboard" component={AdminDashboard} />
        <Route path="/it35-lab2/app" component={Menu} />
        <Route exact path="/it35-lab2/register" component={Register} />
        <Route exact path="/it35-lab2/app/profile" component={Profile} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
