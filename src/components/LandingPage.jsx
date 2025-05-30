import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <section className="landingPageContainer">
      <div className="landingPageContent">
        <h1 className="landingPageHeadline">
          Login to access and manage your information.
        </h1>
        <div className="signInContainer">
          <Link to="LoginForm">
            <button className="loginBtn">Login</button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;
