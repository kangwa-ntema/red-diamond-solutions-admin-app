import { Link } from "react-router-dom";
import "./LandingPage.css";
const LandingPage = () => {
  return (
    <section className="landingPageContainer">
      <h1 className="landingPageHeadline">Login to access and manage you information.</h1>
      <Link to="LoginForm">
        <button className="loginBtn">Login</button>
      </Link>
    </section>
  );
};

export default LandingPage;
