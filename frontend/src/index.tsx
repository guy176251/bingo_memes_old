import { useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
//import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Dropdown from 'react-bootstrap/Dropdown';

import { Link, BrowserRouter as Router, Switch, Route, useHistory, useParams } from 'react-router-dom';

import { FontAwesomeIcon as FaIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCog, faUserCircle, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';

import HomeView from './views/homeview';
import CategoryView from './views/categoryview';
import UserView from './views/userview';
import CardView from './views/cardview';
import LoginView from './views/loginview';
import SignupView from './views/signupview';
import SearchView from './views/searchview';
import CardCreateView from './views/cardcreateview';
import api from './api/backend';
import { UserAuthContext } from './context';
import { User, UserState, Category } from './types';
import SearchBar from './components/searchbar';

import './solarized.css';

const DropdownContainer = ({ children }: any, ref: any) => (
    <div ref={ref}>
        {children}
    </div>
);

const SearchBarr = () => {
    const [ searchInput, setSearchInput ] = useState('');
    const [ showDropdown, setShowDropdown ] = useState(false);
    const [ searchRoute, setSearchRoute ] = useState('');
    const hist = useHistory();

    useEffect(() => {
        if (searchRoute) {
            hist.push(searchRoute);
            setSearchRoute('');
        }
    }, [hist, searchRoute]);
 
    const toggleDropdown = (state: boolean = false) => {
        if (searchInput.length > 0 && !showDropdown)
            return true;
        return state;
    };

    const searchLog = (label: string) => {
        let spacer = '\n        ';
        console.log(`${label}:${spacer}${
            Object.entries({
                searchInput: searchInput,
                searchRoute: searchRoute,
                showDropdown: showDropdown,
            }).map(([ text, value ]) => (
                `${text}: "${value}"`
            )).join(spacer)
        }`);
    }

    searchLog('SEARCHBAR DRAW');
    
    return (
        <Dropdown
            show={showDropdown}
            onToggle={() => {
                searchLog('SEARCHBAR ONTOGGLE');
                setShowDropdown(toggleDropdown());
            }}
            onSelect={(eventKey) => {
                if (eventKey) {
                    setSearchInput('');
                    setShowDropdown(false);
                    setSearchRoute(`${eventKey}${encodeURIComponent(searchInput)}`);
                    console.log(`SEARCHROUTE: ${searchRoute}`);
                }
            }}
        >
            <Dropdown.Toggle as={DropdownContainer} id='search-bar'>
                <div className="input-group">
                    <div
                        className="input-group-prepend"
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="input-group-text">
                            <FaIcon icon={faSearch}/>
                        </span>
                    </div>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search"
                        value={searchInput}
                        onChange={e => {
                            let inputText = e.target.value;
                            let showDropdown = false;
                            
                            if (inputText.length > 0) {
                                showDropdown = true;
                            }

                            setSearchInput(inputText);
                            setShowDropdown(showDropdown);
                        }}
                    />
                </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className='w-100 mt-2 slight-bg'>
                {Object.entries({ 'cards': '/search?q=' }).map(([ label, url ]) => (
                    <Dropdown.Item className='slight-bg' eventKey={url}>
                        Search for "{label}": {searchInput}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
};

const Icon = ({ icon }: { icon: any }) => (
    <h4 className='m-0'>
        <FaIcon icon={icon}/>
    </h4>
);

const LoginDropdown = () => {
    const user = useContext(UserAuthContext);
    const [showDropdown, setDropdown] = useState(false);
    const toggleDropdown = () => setDropdown(!showDropdown);

    const apiLogout = async () => {
        let resp = await api.logout();
    };

    const UserItems = () => (
        <>
            <Dropdown.Item className='slight-bg' disabled>
                {user ? user.name : 'Not Logged In'}
            </Dropdown.Item>
            <Dropdown.Divider/>
            {
                user
                    ?   
                    <Dropdown.Item
                        as={Link}
                        to={{ pathname: `/users/${user.id}/`, state: { userId: user.id } }}
                    >
                        <FaIcon icon={faCog}/> Profile
                    </Dropdown.Item>

                    :
                    <Dropdown.Item className='slight-bg' as={Link} to='/login/'>Login</Dropdown.Item>
            }
        </>

    );
    
    return (
        <Dropdown
            show={showDropdown}
            onToggle={toggleDropdown}
        >
            <div
                onClick={toggleDropdown}
                style={{ cursor: 'pointer' }}
                className='hover-white'
            >
                <Icon icon={faUserCircle}/>
            </div>
            <Dropdown.Toggle as={DropdownContainer} id='login-dropdown'/>
            <Dropdown.Menu align='right' className='slight-bg'>
                <UserItems/>   
            </Dropdown.Menu>
        </Dropdown>
    );
};

const TopNavBar = () => {
    const [showSearch, setSearch] = useState(false);
    const user = useContext(UserAuthContext);
    const params = useParams<{ categoryName?: string }>();
    const { categoryName = '' } = params;
    console.log({ TOPNAV: 'render', categoryName, params });

    const UserItems = () => <>
        {
            user &&
                <Nav.Item className='pr-3'>
                    <Nav.Link
                        as={Link}
                        to={{
                            pathname: '/create/',
                            state: { categoryName },
                        }}
                    >
                        <Icon icon={faPen}/>
                    </Nav.Link>
                </Nav.Item>
        }
        <Nav.Item>
            <LoginDropdown/>
        </Nav.Item>
    </>;
    
    const searchbar = 
        <SearchBar
            label='Search'
            apiCall={(query) => api.getTopThreeCategories(query)}
            resultMapper={(result: Category) => 
                <Dropdown.Item as={Link} to={`/categories/${result.name}/`}>
                    Go to {result.name}
                </Dropdown.Item>
            }
        />;
    
    return (
        <>
            <Navbar id='desktop-topnav' className='shadow sdark-fg d-none d-lg-block' variant='dark' sticky='top'>
                <Container>
                    <Col xs={3}>
                        <Nav>
                            <Nav.Item>
                                <Nav.Link as={Link} to='/categories/TrashTaste1/'>TrashTaste1</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Col>
                    <Col xs={6} className='w-100'>
                        <div className="align-items-center justify-content-center">
                            {searchbar}
                        </div>
                    </Col>
                    <Col xs={3}>
                        <Nav className='align-items-center justify-content-end'>
                            <UserItems/>
                        </Nav>
                    </Col>
                </Container>
            </Navbar>

            <Navbar id='mobile-topnav' className='shadow sdark-fg d-lg-none' variant='dark' sticky='top'>
                <Container id='topnav-buttons' className={'w-100 ' + (!showSearch ? '' : 'd-none')}>
                    <Col xs={6}>
                        <Nav>
                            <Nav.Item>
                                <Nav.Link as={Link} to='/categories/TrashTaste1/'>TrashTaste1</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Col>
                    <Col xs={6}>
                        <Nav className='align-items-center justify-content-end'>
                            <Nav.Item onClick={() => setSearch(true)} className='pr-3'>
                                <Nav.Link>
                                    <Icon icon={faSearch}/>
                                </Nav.Link>
                            </Nav.Item>
                            <UserItems/>
                        </Nav>
                    </Col>
                </Container>
                <Container id="topnav-search" className={'py-1 ' + (showSearch ? '' : 'd-none')}>
                    <Col xs={1} className='px-2'>
                        <div onClick={() => setSearch(false)} style={{ cursor: 'pointer' }}>
                            <Icon icon={faTimes}/>
                        </div>
                    </Col>
                    <Col xs={11} className='px-2'>
                        {searchbar}
                    </Col>
                </Container>
            </Navbar>
        </>
    );
}

const App = () => {
    const [user, setUser] = useState<UserState>(null);
    const login = (u: User) => setUser(u);
    const logout = () => setUser(null);
    //const loc = useLocation();
 
    useEffect(() => {
        (async () => {
            let { data, ok } = await api.getSession();
            if (ok && data && data.user) {
                setUser(data.user);
            }
        })();
    }, []);
    
    return (
        <div className='sdark-bg'>
            <Router>
                
                <UserAuthContext.Provider value={user}>
                    <TopNavBar/>
                </UserAuthContext.Provider>
                
                <Container>
                    <div className="py-2">
                        <Switch>
                            <Route exact path='/'>
                                <HomeView/>
                            </Route>
                            <Route exact path='/signup/'>
                                <SignupView/>
                            </Route>
                            <Route exact path='/login/'>
                                <LoginView
                                    login={login}
                                    logout={logout}
                                    user={user}
                                />
                            </Route>
                            <UserAuthContext.Provider value={user}>
                                <Route exact path='/search/'>
                                    <SearchView/>
                                </Route>
                                <Route path='/categories/:categoryName/'>
                                    <CategoryView/>
                                </Route>
                                <Route path='/users/:userId/'>
                                    <UserView/>
                                </Route>
                                <Route exact path='/cards/:cardId/edit/'>
                                    <CardCreateView/>
                                </Route>
                                <Route exact path='/cards/:cardId/'>
                                    <CardView/>
                                </Route>
                                <Route path='/create/'>
                                    <CardCreateView/>
                                </Route>
                                <Route path='/profile/'>
                                    <UserView/>
                                </Route>
                            </UserAuthContext.Provider>
                            <Route>
                                <h2 className="text-sdark-red text-center">Page Not Found.</h2>
                            </Route>
                        </Switch>
                    </div>
                </Container>
            </Router>
        </div>
    );
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
