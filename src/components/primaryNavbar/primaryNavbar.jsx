import './primaryNavbar.css';
import PrimaryNavLogo from '../../assets/logo-images/red-diamond-primary-logo-white-typeface.png';

const primaryNavbar = () => {
    return (<div className="appPrimaryNavbarContainer">
                        <header className="appPrimaryNavbar">
                            <div className="primaryNavLogoContainer">
                                <span>
                                    <img
                                        src={PrimaryNavLogo}
                                        alt="Red Diamond Solutions Logo"
                                        className="primaryNavLogo"
                                    />
                                </span>
                                <span className="appPrimaryNavbarHeadline">
                                    <h1>Management Portal.</h1>
                                </span>
                            </div>
                        </header>
                    </div>)
}

export default primaryNavbar;