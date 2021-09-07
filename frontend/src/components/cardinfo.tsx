import { useState } from "react";

import { Link, useHistory } from "react-router-dom";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

import { FontAwesomeIcon as FaIcon } from "@fortawesome/react-fontawesome";
import {
    faMinusCircle,
    faPlusCircle,
    faTrash,
    faEdit,
    faArrowUp,
    faArrowDown,
    IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import { BingoCard } from "../types";
import api from "../api/backend";
import { useAuth } from "../auth";
import { HashtagButton } from "../components/snippets";
import { createdAtStr } from "../components/helpers";
//import debugLog from "../debug";

const upvoteScore = (uv: boolean | null) => (uv === null ? 0 : uv ? 1 : -1);

interface VoteButtonsProps {
    card: BingoCard;
    itemMargin?: string;
}

const VoteButtons = ({ card, itemMargin = "" }: VoteButtonsProps) => {
    const [upvoted, setUpvoted] = useState<boolean | null>(card.upvoted);

    const upColor = upvoted ? "orange" : "fg";
    const downColor = upvoted === false ? "violet" : "fg";
    const scoreColor = upvoted === null ? "fg" : upvoted ? "orange" : "violet";
    const scoreAdjust = upvoteScore(upvoted) - upvoteScore(card.upvoted);

    const voteAction = (up: boolean) => {
        setUpvoted(upvoted === null || up !== upvoted ? up : null);
        api.createVote({ card: { id: card.id }, up: up });
    };

    /*
        <Col xs={2} className="border-sdark-right text-center">
        </Col>
    */
    return (
        <>
            <div className={itemMargin}>
                <VoteButtonSingle
                    icon={faArrowUp}
                    color={`text-sdark-${upColor}`}
                    voteAction={() => voteAction(true)}
                />
            </div>
            <div className={`text-sdark-${scoreColor} ${itemMargin}`}>
                <h5 className="m-0">{card.score + scoreAdjust}</h5>
            </div>
            <div className={itemMargin}>
                <VoteButtonSingle
                    icon={faArrowDown}
                    color={`text-sdark-${downColor}`}
                    voteAction={() => voteAction(false)}
                />
            </div>
        </>
    );
};

interface VoteButtonSingleProps {
    icon: IconDefinition;
    color: string;
    voteAction: () => void;
}

const VoteButtonSingle = ({ icon, color, voteAction }: VoteButtonSingleProps) => {
    const { ifAuth } = useAuth();

    return (
        <div className={`${color} vote-btn p-1 rounded`} onClick={() => ifAuth(voteAction)}>
            <FaIcon icon={icon} />
        </div>
    );
};

const EditDeleteButtons = ({ card, itemMargin = "" }: { itemMargin?: string; card: BingoCard }) => {
    const { user } = useAuth();
    const history = useHistory();
    const [showModal, setModal] = useState(false);
    const toggleModal = () => setModal(!showModal);

    return (
        <>
            {user && card.author.id === user.id && (
                <>
                    <Link to={`/cards/${card.id}/edit/`}>
                        <div className={`text-sdark-red ${itemMargin}`}>
                            <FaIcon icon={faEdit} />
                        </div>
                    </Link>
                    <div className={`text-sdark-red ${itemMargin}`} style={{ cursor: "pointer" }} onClick={toggleModal}>
                        <FaIcon icon={faTrash} />
                    </div>
                    <Modal
                        show={showModal}
                        dialogAs={(props) => (
                            <Modal.Dialog centered>
                                <div {...props} className="modal-content rounded slight-bg"></div>
                            </Modal.Dialog>
                        )}
                    >
                        <Modal.Header closeButton>Delete Bingo Card</Modal.Header>
                        <Modal.Body>Are you sure you want to delete bingo card "{card.name}"?</Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="danger"
                                onClick={async () => {
                                    await api.deleteCard(card.id);
                                    history.go(0);
                                }}
                            >
                                Yes
                            </Button>
                            <Button variant="success" onClick={toggleModal}>
                                No
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </>
            )}
        </>
    );
};

interface CardInfoProps {
    card: BingoCard;
    minimal?: boolean;
    link?: boolean;
    collapse?: boolean;
}

const CardInfo = ({ card, link, collapse = false, minimal = false }: CardInfoProps) => {
    const { user } = useAuth();

    const userLink = <Link to={`/users/${card.author.id}/`}>{card.author.name}</Link>;
    const categoryLink = <Link to={`/categories/${card.category.name}/`}>{card.category.name}</Link>;
    const cardLinkUrl = `/cards/${card.id}/`;

    const CardLink = () =>
        link ? (
            <Link to={cardLinkUrl}>
                <h5 className="m-0">{card.name}</h5>
            </Link>
        ) : (
            <h5 className="m-0">{card.name}</h5>
        );

    const CardDetails = () => (
        <p className="text-sdark-fg m-0">
            submitted {createdAtStr(card.created_at)} by {userLink} to {categoryLink}
        </p>
    );

    const Hashtags = ({ itemMargin = "" }: { itemMargin?: string }) => (
        <>
            {card.hashtags.map((hashtag) => (
                <div className={itemMargin}>
                    <HashtagButton name={hashtag.name} category={card.category} />
                </div>
            ))}
        </>
    );

    const margin = "me-3";
    const CardInfoContents = () => (
        <Row className="g-3">
            <Col xs={12}>
                <CardDetails />
            </Col>
            <Col xs={12} lg={6} className="order-lg-3">
                <div className="d-flex flex-wrap align-items-center">
                    <Hashtags itemMargin="pe-2 py-1" />
                </div>
            </Col>
            <Col xs={12} lg={6} className="order-lg-2">
                <div className="d-flex flex-wrap align-items-center">
                    <VoteButtons card={card} itemMargin={margin} />
                    <EditDeleteButtons card={card} itemMargin={margin} />
                </div>
            </Col>
        </Row>
    );

    const CardInfoCollapse = () => {
        const [collapsed, setCollapsed] = useState(collapse);

        // responsive collapse
        // collapse on toggle, but also auto-collapse on mobile
        // idk if I'm crazy but this half makes sense
        //
        const collapsedClass = collapsed ? "" : "";
        const expandedClass = collapsed ? "" : "";

        const CollapseButton = () => (
            <div
                className="hover-white rounded-circle"
                style={{ cursor: "pointer" }}
                onClick={() => setCollapsed(!collapsed)}
            >
                <FaIcon icon={collapsed ? faPlusCircle : faMinusCircle} />
            </div>
        );

        const gutter = "g-2";

        return (
            <div className="p-3 rounded sdark-fg">
                <Row>
                    <Col xs={2}>
                        <div className="d-flex justify-content-center">
                            <CollapseButton />
                        </div>
                    </Col>
                    <Col xs={10} className="ps-0">
                        <Row className={gutter}>
                            <Col xs={12}>
                                <CardLink />
                            </Col>
                            <Col id="collapse-content" xs={12} className={collapsed ? "d-none" : ""}>
                                <Row className={gutter}>
                                    <Col xs={12}>
                                        <CardDetails />
                                    </Col>
                                    <Col xs={12}>
                                        <div className="d-flex flex-wrap align-items-center">
                                            <Hashtags itemMargin="pe-2 py-1" />
                                        </div>
                                    </Col>
                                    <Col xs={12}>
                                        <div className="d-flex flex-wrap align-items-center">
                                            <VoteButtons card={card} itemMargin={margin} />
                                            <EditDeleteButtons card={card} itemMargin={margin} />
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        );
    };
    return minimal ? <CardInfoContents /> : <CardInfoCollapse />;
};

export default CardInfo;
/*
    const CardDetails = () => (
        <>
            <Row>
                <Col>
                    <CardLink />
                    <p className="text-sdark-fg">
                        submitted {createdAtStr(card.created_at)} by {userLink} to {categoryLink}
                    </p>
                </Col>
            </Row>
            <Row>
                <Col>
                    {card.hashtags.map((hashtag) => (
                        <HashtagButton name={hashtag.name} category={card.category} />
                    ))}
                </Col>
            </Row>
        </>
    );

* */
