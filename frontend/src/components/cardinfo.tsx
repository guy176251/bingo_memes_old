import { useState, useContext } from 'react';

import { Link, useHistory } from "react-router-dom";

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';
//import Button from 'react-bootstrap/Button';

import { FontAwesomeIcon as FaIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faArrowUp, faArrowDown, IconDefinition } from '@fortawesome/free-solid-svg-icons';

import { BingoCard, UserState } from '../types'
import { UserAuthContext } from '../context';
import api from '../api/backend';

const minute = 1000 * 60;
const hour = minute * 60;
const day = hour * 24;
const month = day * 31;
const year = month * 12;
const times: { [s: string]: number } = {
    year: year,
    month: month,
    day: day,
    hour: hour,
    minute: minute,
}

const dateStr = (isoString: string) => {
    var now = new Date(Date.now());
    var date = new Date(Date.parse(isoString));
    var diff = now.getTime() - date.getTime();
 
    for (const str in times) {
        let time = times[str];
        if (diff >= time) {
            let value = Math.floor(diff / time);
            value = time === minute ? value % 60 : value;
            let s = value > 1 ? 's' : '';
            return `${value} ${str}${s} ago`;
        }
    }

    return 'just now';
}

const sendVote = async (card: BingoCard, up: boolean) => {
    await api.createVote({ card: { id: card.id }, up: up });
}

interface VoteButtonsProps {
    card: BingoCard;
}

const VoteButtons = ({ card }: VoteButtonsProps) => {
    const user = useContext(UserAuthContext);
    const inactiveColor = 'sdark-fg';
    const upColor = 'sdark-orange';
    const downColor = 'sdark-violet';

    var u = false;
    var d = false;
    var a = 0;
    var t = `text-${inactiveColor}`;
    if (card.upvoted !== null) {
        a = card.upvoted ? -1 : 1;
        if (card.upvoted) {
            u = true;
            t = `text-${upColor}`;
        }
        else {
            d = true;
            t = `text-${downColor}`;
        }
    }
    
    var voteAdjust = a;
    const [up, setUp] = useState(u);
    const [down, setDown] = useState(d);
    const [scoreColor, setScoreColor] = useState(t);
    
    const changeVoteState = (
        activeColor: string,
        state: boolean,
        setState: (b: boolean) => void
    ) => {
        
        setUp(false);
        setDown(false);
        setState(!state);
        setScoreColor('text-' + (!state ? activeColor : inactiveColor));
    };

    const upvoteClick = () => {
        changeVoteState(upColor, up, setUp);
        sendVote(card, true);
    }
    const downvoteClick = () => {
        changeVoteState(downColor, down, setDown);
        sendVote(card, false);
    }

    var currentUpColor = up ? upColor : inactiveColor;
    var currentDownColor = down ? downColor : inactiveColor;

    var voteScore = 0;
    if (up && !down)
        voteScore = 1;
    else if (down && !up)
        voteScore = -1;
 
    voteScore += voteAdjust;
    var loggedIn = Boolean(user);
    // 🡅 🡇
    return (
        <Col xs={2} className='border-sdark-right text-center'>
            <VoteButtonSingle
                icon={faArrowUp}
                color={currentUpColor}
                loggedIn={loggedIn}
                voteAction={upvoteClick}
                user={user}
            />
            <div className={`my-1 ${scoreColor}`}>
                <h5>{card.score + voteScore}</h5>
            </div>
            <VoteButtonSingle
                icon={faArrowDown}
                color={currentDownColor}
                loggedIn={loggedIn}
                voteAction={downvoteClick}
                user={user}
            />
        </Col>
    );
}

interface VoteButtonSingleProps {
    icon: IconDefinition;
    color: string;
    loggedIn: boolean;
    voteAction: () => void;
    user: UserState;
}

const VoteButtonSingle = ({ icon, color, loggedIn, voteAction, user }: VoteButtonSingleProps) =>
    <div
        className={`text-${color} ${user ? 'vote-btn' : ''} p-1 rounded`}
        onClick={loggedIn ? voteAction : () => {}}
        style={loggedIn ? { cursor: 'pointer' } : {}}
    >
        <FaIcon icon={icon} />
    </div>;

interface CardInfoProps {
    card: BingoCard;
    link?: boolean;
}

const CardInfo = ({ card, link }: CardInfoProps) => {
    const history = useHistory();
    const [showModal, setModal] = useState(false);
    const user = useContext(UserAuthContext);
    const toggleModal = () => setModal(!showModal);
    //const goToEdit = () => history.push({ pathname: `/cards/${card.id}/edit/`, state: { cardId: card.id } });

    const userLink = <Link to={`/users/${card.author.id}/`}>{card.author.name}</Link>;
    const categoryLink = <Link to={`/categories/${card.category.name}/`}>{card.category.name}</Link>;
    const cardLinkUrl = `/cards/${card.id}/`;

    //const cardLink = (
    //    <Link to={{
    //        pathname: cardLinkUrl,
    //        state: {
    //            card: card
    //        },
    //    }}>
    //        <h5>
    //            {card.name}
    //        </h5>
    //    </Link>
    //);

    const CardLink = () => (
        link
            ?
            <Link to={cardLinkUrl}>
                <h5>{card.name}</h5>
            </Link>

            :
            <h5>{card.name}</h5>
    );

    const CardDetails = () => 
        <Col>
            <CardLink/>
            <p className='text-sdark-fg'>
                submitted {dateStr(card.created_at)} by {userLink} to {categoryLink}
            </p>
        </Col>;
        
    const CardControls = () => <>{
        user && card.author.id === user.id &&
            <Col xs={1} className='border-sdark-left text-center'>
                <Row className="d-flex justify-content-center align-items-center h-50">
                    <Link to={`/cards/${card.id}/edit/`}>
                        <div className="text-sdark-red">
                            <FaIcon icon={faEdit}/>
                        </div>
                    </Link>
                </Row>
                <Row className="d-flex justify-content-center align-items-center h-50">
                    <div
                        className="text-sdark-red"
                        style={{ cursor: 'pointer' }}
                        onClick={toggleModal}
                    >
                        <FaIcon icon={faTrash}/>
                    </div>
                </Row>
            </Col>
    }</>;

    const DeleteModal = () =>
        <Modal
            show={showModal}
            dialogAs={props =>
                <Modal.Dialog centered>
                    <div {...props} className="modal-content rounded slight-bg">
                    </div>
                </Modal.Dialog>
            }
        >
            <Modal.Header closeButton>
                Delete Bingo Card
            </Modal.Header>
            <Modal.Body>
                Are you sure you want to delete bingo card "{card.name}"?
            </Modal.Body>
            <Modal.Footer>
                <button
                    className="btn btn-danger"
                    onClick={async () => {
                        await api.deleteCard(card.id);
                        history.go(0);
                    }}
                >
                    Yes
                </button>
                <button
                    className="btn btn-primary"
                    onClick={toggleModal}
                >
                    No
                </button>
            </Modal.Footer>
        </Modal>;
    
    return (
        <div className="p-3 rounded sdark-fg">
            <Row>
                <VoteButtons card={card}/>
                <CardDetails/>
                <CardControls/>
                <DeleteModal/>
            </Row>
        </div>
    );
}

export default CardInfo;
