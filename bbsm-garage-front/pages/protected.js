import ProtectedComponent from '../components/ProtectedComponent';
import withAuth from '../withAuth';

const ProtectedPage = () => {
  return (
    <div>
      <ProtectedComponent />
    </div>
  );
};

export default withAuth(ProtectedPage);
