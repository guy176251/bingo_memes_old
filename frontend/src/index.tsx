import {
    //faPen,
    faCog,
    faPencilAlt,
    faSearch,
    faSignInAlt,
    faSignOutAlt,
    faTh,
    faTimes,
    faUser,
    faUserCircle,
    IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon as FaIcon } from "@fortawesome/react-fontawesome";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import api from "./api/backend";
import { ProvideAuth, useAuth } from "./auth";
import SearchBar from "./components/searchbar";
import "./scss/main.scss";
import "./scss/sidebar.scss";
import { BingoCard } from "./types";
import CardCreateViewkjahsdk from "./views/cardcreateview";
import CardView from "./views/cardview";
import CategoryView from "./views/categoryview";
import HomePageView from "./views/homepageview";
import LoginView from "./views/loginview";
import SearchView from "./views/searchview";
import SignupView from "./views/signupview";
import UserView from "./views/userview";

const DropdownContainer = ({ children }: any, ref: any) => <div ref={ref}>{children}</div>;

const Icon = ({ icon }: { icon: any }) => (
    <h4 className="m-0">
        <FaIcon icon={icon} />
    </h4>
);

const LoginDropdown = () => {
    const { user, logout } = useAuth();
    const [showDropdown, setDropdown] = useState(false);

    const toggleDropdown = () => setDropdown(!showDropdown);

    interface IconRowProps {
        label: string;
        icon: IconDefinition;
    }

    const IconRow = ({ label, icon }: IconRowProps) => (
        <>
            <FaIcon icon={icon} className="me-2" /> {label}
        </>
    );

    const UserItems = () => (
        <>
            <Dropdown.Item className="slight-bg" disabled>
                {user ? <IconRow label={user.name} icon={faUser} /> : "Not Logged In"}
            </Dropdown.Item>
            <Dropdown.Divider />
            {user ? (
                <>
                    <Dropdown.Item
                        as={Link}
                        to={{
                            pathname: `/users/${user.id}/`,
                            state: { userId: user.id },
                        }}
                    >
                        <IconRow label="Profile" icon={faCog} />
                    </Dropdown.Item>

                    <Dropdown.Item onClick={() => logout({})}>
                        <IconRow label="Logout" icon={faSignOutAlt} />
                    </Dropdown.Item>
                </>
            ) : (
                <Dropdown.Item className="slight-bg" as={Link} to="/login/">
                    <IconRow label="Login" icon={faSignInAlt} />
                </Dropdown.Item>
            )}
        </>
    );

    return (
        <Dropdown show={showDropdown} onToggle={toggleDropdown}>
            <div onClick={toggleDropdown} style={{ cursor: "pointer" }} className="hover-white">
                <Icon icon={faUserCircle} />
            </div>
            <Dropdown.Toggle as={DropdownContainer} id="login-dropdown" />
            <Dropdown.Menu align="end" className="slight-bg">
                <UserItems />
            </Dropdown.Menu>
        </Dropdown>
    );
};

const TopNavBar = () => {
    const [showSearch, setSearch] = useState(false);
    //const { user } = useAuth();

    const UserItems = () => (
        <>
            {/*
            {user && (
                <Nav.Item className="pr-3">
                    <Nav.Link as={Link} to="/create/card/">
                        <Icon icon={faPen} />
                    </Nav.Link>
                </Nav.Item>
            )}
            */}
            <Nav.Item>
                <LoginDropdown />
            </Nav.Item>
        </>
    );

    const searchbar = (
        <SearchBar
            label={<FaIcon icon={faSearch} />}
            apiCall={(query) => api.getTopThreeCards(query)}
            resultMapper={(result: BingoCard[], query: string) =>
                result.length > 0
                    ? [
                          ...result.map((card) => (
                              <Dropdown.Item as={Link} to={`/cards/${card.id}/`} className="mb-2">
                                  <small>
                                      <FaIcon icon={faTh} /> <FaIcon icon={faPencilAlt} className="me-2" /> {card.name}
                                  </small>
                              </Dropdown.Item>
                          )),

                          <Dropdown.Item as={Link} to={`/search/?q=${query}`}>
                              <small>
                                  <FaIcon icon={faSearch} className="me-2" /> Search bingo cards for "{query}"
                              </small>
                          </Dropdown.Item>,
                      ]
                    : [
                          <Dropdown.Item className="slight-bg" disabled>
                              <small>
                                  <FaIcon icon={faTimes} className="me-2" /> No results for "{query}"
                              </small>
                          </Dropdown.Item>,
                      ]
            }
        />
    );

    return (
        <>
            <Navbar id="desktop-topnav" className="sdark-fg d-none d-lg-block" variant="dark">
                <Container>
                    <Col xs={3}>
                        <Nav>
                            <Nav.Item>
                                <Nav.Link as={Link} to="/">
                                    BingoMemes
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Col>
                    <Col xs={6}>
                        <div className="align-items-center justify-content-center">{searchbar}</div>
                    </Col>
                    <Col xs={3}>
                        <Nav className="align-items-center justify-content-end">
                            <UserItems />
                        </Nav>
                    </Col>
                </Container>
            </Navbar>

            <Navbar id="mobile-topnav" className="sdark-fg d-lg-none" variant="dark">
                <Container id="topnav-buttons" className={"w-100 " + (!showSearch ? "" : "d-none")}>
                    <Col xs={6}>
                        <Nav>
                            <Nav.Item>
                                <Nav.Link as={Link} to="/">
                                    BingoMemes
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Col>
                    <Col xs={6}>
                        <Nav className="align-items-center justify-content-end">
                            <Nav.Item onClick={() => setSearch(true)} className="pe-3">
                                <Nav.Link>
                                    <Icon icon={faSearch} />
                                </Nav.Link>
                            </Nav.Item>
                            <UserItems />
                        </Nav>
                    </Col>
                </Container>
                <Container id="topnav-search" className={"py-1 " + (showSearch ? "" : "d-none")}>
                    <Col xs={1} className="px-2">
                        <div onClick={() => setSearch(false)} style={{ cursor: "pointer" }}>
                            <Icon icon={faTimes} />
                        </div>
                    </Col>
                    <Col xs={11} className="px-2">
                        {searchbar}
                    </Col>
                </Container>
            </Navbar>
        </>
    );
};

const App = () => {
    const containerRoutes: { [s: string]: React.FC } = {
        "/categories/:categoryName/create/": CardCreateViewkjahsdk,
        "/cards/:cardId/edit/": CardCreateViewkjahsdk,
        "/signup/": SignupView,
        "/login/": LoginView,
        "/cards/:cardId/": CardView,
    };

    return (
        <div className="sdark-bg">
            <TopNavBar />
            <Switch>
                {/* CARD LIST ROUTES; DOESN'T NEED CONTAINER */}
                <Route exact path="/categories/:categoryName/">
                    <CategoryView />
                </Route>
                <Route exact path="/users/:userId/">
                    <UserView />
                </Route>
                <Route exact path="/search/">
                    <SearchView />
                </Route>
                <Route exact path="/profile/">
                    <UserView />
                </Route>
                <Route exact path="/" component={HomePageView}></Route>

                {/* CONTAINER ROUTES */}
                {Object.entries(containerRoutes).map(([url, View]) => (
                    <Route exact path={url}>
                        <div className="py-3">
                            <Container>
                                <View />
                            </Container>
                        </div>
                    </Route>
                ))}

                {/* GENERIC ERROR */}
                <Route>
                    <h2 className="text-sdark-red text-center">Page Not Found.</h2>
                </Route>
            </Switch>
        </div>
    );
};

ReactDOM.render(
    <Router>
        <ProvideAuth>
            <App />
        </ProvideAuth>
    </Router>,
    document.getElementById("root")
);
