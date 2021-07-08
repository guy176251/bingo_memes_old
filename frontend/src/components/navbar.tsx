import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion, faHandPointDown, faHandPointUp, IconDefinition } from '@fortawesome/free-solid-svg-icons';

export type AppNavBarButtons = Array<[IconDefinition, string, () => void | undefined]>;

interface AppNavBarProps {
  id?: string;
  spacer?: boolean;
  buttons?: AppNavBarButtons;
}

const scrollToY = (y: number) => window.scrollTo({ top: y, behavior: "smooth" });
const scrollToTop = () => scrollToY(0);
const scrollToBottom = () => scrollToY(document.body.scrollHeight);

const NavBarUnit = ({ spacer, buttons }: AppNavBarProps) =>  {
  const navItem = (
    icon: IconDefinition,
    text: string,
    onclick?: () => void,
  ) => (
    <Nav.Item onClick={onclick}>
      <Nav.Link>
        <FontAwesomeIcon className={spacer ? 'text-sdark-spacer' : 'text-sdark-fg'} icon={icon} />
        <br/>
        <small className={spacer ? 'text-sdark-spacer' : 'text-sdark-fg'}>{text}</small>
      </Nav.Link>
    </Nav.Item>
  )

  return (
    <Navbar
      fixed={spacer ? undefined : 'bottom'}
      className={spacer ? 'sdark-spacer py-0' : 'sdark-fg shadow py-1'}
    >
      <Container>
        <Nav fill className='w-100'>
          {
            spacer
              ?  navItem(faQuestion, 'Bottom of page')
              : [
                  navItem(faHandPointDown, 'Bottom', scrollToBottom),
                  navItem(faHandPointUp, 'Top', scrollToTop),
                ]
          }
          {
            buttons?.length && buttons.map(things => navItem(...things))
          }
        </Nav>
      </Container>
    </Navbar>
  );
}

export const AppNavBar = (props: AppNavBarProps) => (
  <div id="navbars" className='d-md-none'>
    <NavBarUnit spacer/>
    <NavBarUnit {...props}/>
  </div>
);
