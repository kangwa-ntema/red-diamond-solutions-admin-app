import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <>
      <h1>Login to access and manage you information.</h1>
      <Link to="LoginForm">
        <button>Login</button>
      </Link>
    </>
  );
};

export default LandingPage;
