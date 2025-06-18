import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <section className="landingPageContainer">
      <div className="landingPageContent">
        <h1 className="landingPageHeadline">
          Login to Access and Manage Your Information.
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
