import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Home from '@/pages/Home';
import Artanis from '@/pages/Artanis';
import Triania from '@/pages/Triania';
import Couple from '@/pages/Couple';
import Admin from '@/pages/Admin';
import Layout from '@/components/Layout';
import AgeGate from '@/components/AgeGate';
import LustGate from '@/components/LustGate';
import Explore from '@/pages/Explore';
import Videos from '@/pages/Videos';
import Photos from '@/pages/Photos';
import Stories from '@/pages/Stories';
import Topics from '@/pages/Topics';
import Library from '@/pages/Library';
import Live from '@/pages/Live';
import Interactive from '@/pages/Interactive';
import Messages from '@/pages/Messages';
import RequestPage from '@/pages/RequestPage';
import Account from '@/pages/Account';
import ExperiencePlayer from '@/pages/ExperiencePlayer';
import Profile from '@/pages/Profile';
import Groups from '@/pages/Groups';
import StartCall from '@/pages/StartCall';
import VideoCall from '@/pages/VideoCall';
import Studio from '@/pages/Studio';
import Community from '@/pages/Community';
import Coins from '@/pages/Coins';
import InviteClaim from '@/components/InviteClaim';
import CreatorDetail from '@/pages/CreatorDetail';
import Contests from '@/pages/Contests';
import ContestDetail from '@/pages/ContestDetail';
import AiVideoCall from '@/pages/AiVideoCall';
import Leitstand from '@/pages/Leitstand';
import Therapy from '@/pages/Therapy';
import PayLinks from '@/pages/PayLinks';
import Pay from '@/pages/Pay';
import TherapySession from '@/pages/TherapySession';
import WaitingChatAlert from '@/components/WaitingChatAlert';
import HostLiveAlert from '@/components/HostLiveAlert';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
      <InviteClaim />
      <WaitingChatAlert />
      <HostLiveAlert />
      <Routes>
      {/* Add your page Route elements here */}
      <Route path="/experience/:id" element={<ExperiencePlayer />} />
      <Route path="/ai-call/:id" element={<AiVideoCall />} />
      <Route path="/call" element={<StartCall />} />
      <Route path="/call/:token" element={<VideoCall />} />
      <Route path="/pay/:token" element={<Pay />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/artanis" element={<Artanis />} />
        <Route path="/triania" element={<Triania />} />
        <Route path="/couple" element={<Couple />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/library" element={<Library />} />
        <Route path="/live" element={<Live />} />
        <Route path="/interactive" element={<Interactive />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/community" element={<Community />} />
        <Route path="/coins" element={<Coins />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/leitstand" element={<Leitstand />} />
        <Route path="/therapy" element={<Therapy />} />
        <Route path="/therapy/:id" element={<TherapySession />} />
        <Route path="/paylinks" element={<PayLinks />} />
        <Route path="/creator/:id" element={<CreatorDetail />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/contests/:id" element={<ContestDetail />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AgeGate />
          <LustGate />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App