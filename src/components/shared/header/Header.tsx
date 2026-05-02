import React, { useContext, useEffect, useRef, useState } from "react";
import {
  FiAlignLeft,
  FiArrowLeft,
  FiArrowRight,
  FiMoon,
  FiSun,
  FiLogOut, // Added import for logout icon
} from "react-icons/fi";
import ProfileModal from "./ProfileModal";
import { NavigationContext } from "../../../contentApi/navigationProvider";
import { useAuth } from "@/context/AuthContext"; // Added import for auth
import { Link } from "react-router-dom"; // Added import for Link (if not already present)

const Header = () => {
  const { navigationOpen, setNavigationOpen } = useContext(NavigationContext);
  const [navigationExpend, setNavigationExpend] = useState(false);
  const miniButtonRef = useRef(null);
  const expendButtonRef = useRef(null);
  const { user, logout } = useAuth(); // Added auth hook

  const handleThemeMode = (type) => {
    if (type === "dark") {
      document.documentElement.classList.add("app-skin-dark");
      localStorage.setItem("skinTheme", "dark");
    } else {
      document.documentElement.classList.remove("app-skin-dark");
      localStorage.setItem("skinTheme", "light");
    }
  };

  // Added logout handler (similar to ProfileModal)
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const newWindowWidth = window.innerWidth;
      if (newWindowWidth <= 1024) {
        document.documentElement.classList.remove("minimenu");
        document.querySelector(".navigation-down-1600").style.display = "none";
      } else if (newWindowWidth >= 1025 && newWindowWidth <= 1400) {
        document.documentElement.classList.add("minimenu");
        document.querySelector(".navigation-up-1600").style.display = "none";
        document.querySelector(".navigation-down-1600").style.display = "block";
      } else {
        document.documentElement.classList.remove("minimenu");
        document.querySelector(".navigation-up-1600").style.display = "block";
        document.querySelector(".navigation-down-1600").style.display = "none";
      }
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    const savedSkinTheme = localStorage.getItem("skinTheme");
    handleThemeMode(savedSkinTheme);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleNavigationExpendUp = (e, pram) => {
    e.preventDefault();
    if (pram === "show") {
      setNavigationExpend(true);
      document.documentElement.classList.add("minimenu");
    } else {
      setNavigationExpend(false);
      document.documentElement.classList.remove("minimenu");
    }
  };

  const handleNavigationExpendDown = (e, pram) => {
    e.preventDefault();
    if (pram === "show") {
      setNavigationExpend(true);
      document.documentElement.classList.remove("minimenu");
    } else {
      setNavigationExpend(false);
      document.documentElement.classList.add("minimenu");
    }
  };

  return (
    <header className="nxl-header">
      <div className="header-wrapper">
        {/* <!--! [Start] Header Left !--> */}
        <div className="header-left d-flex align-items-center gap-4">
          {/* <!--! [Start] nxl-head-mobile-toggler !--> */}
          <a
            href="#"
            className="nxl-head-mobile-toggler"
            onClick={(e) => {
              e.preventDefault(), setNavigationOpen(true);
            }}
            id="mobile-collapse"
          >
            <div
              className={`hamburger hamburger--arrowturn ${
                navigationOpen ? "is-active" : ""
              }`}
            >
              <div className="hamburger-box">
                <div className="hamburger-inner"></div>
              </div>
            </div>
          </a>
          {/* <!--! [End] nxl-head-mobile-toggler !-->
                    <!--! [Start] nxl-navigation-toggle !--> */}
          <div className="nxl-navigation-toggle navigation-up-1600"></div>
          <div className="nxl-navigation-toggle navigation-down-1600">
            <a
              href="#"
              onClick={(e) => handleNavigationExpendDown(e, "hide")}
              id="menu-mini-button"
              ref={miniButtonRef}
              style={{ display: navigationExpend ? "block" : "none" }}
            >
              <FiAlignLeft size={24} />
            </a>
            <a
              href="#"
              onClick={(e) => handleNavigationExpendDown(e, "show")}
              id="menu-expend-button"
              ref={expendButtonRef}
              style={{ display: navigationExpend ? "none" : "block" }}
            >
              <FiArrowRight size={24} />
            </a>
          </div>
          {/* <!--! [End] nxl-navigation-toggle !--> */}
        </div>
        {/* <!--! [End] Header Left !-->
                <!--! [Start] Header Right !--> */}
        <div className="header-right ms-auto">
          <div className="d-flex align-items-center">
            {/* <!--! [Start] Dark-Light Theme Toggle !--> */}
            <div className="nxl-h-item dark-light-theme">
              <div
                className="nxl-head-link me-0 dark-button"
                onClick={() => handleThemeMode("dark")}
              >
                <FiMoon size={20} />
              </div>
              <div
                className="nxl-head-link me-0 light-button"
                onClick={() => handleThemeMode("light")}
                style={{ display: "none" }}
              >
                <FiSun size={20} />
              </div>
            </div>
            {/* <!--! [End] Dark-Light Theme Toggle !--> */}

       

            {/* <!--! [Start] Profile Modal !--> */}
            <ProfileModal />
            {/* <!--! [End] Profile Modal !--> */}

                 {/* <!--! [New] Logout Option !--> */}
                 <Link
              to="#"
              className="nxl-head-link me-0"
              onClick={async (e) => {
                e.preventDefault();
                await handleLogout();
              }}
              title="Logout"
            >
              <FiLogOut size={20} />
            </Link>
            {/* <!--! [End] New Logout Option !--> */}
          </div>
        </div>
        {/* <!--! [End] Header Right !--> */}
      </div>
    </header>
  );
};

export default Header;