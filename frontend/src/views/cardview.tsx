import { useState, useRef, ReactElement, useEffect, ReactNode } from "react";
import { Helmet } from "react-helmet";

import { useParams } from "react-router-dom";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

import { FontAwesomeIcon as FaIcon } from "@fortawesome/react-fontawesome";
import {
    IconDefinition,
    faTh,
    faEye,
    faAlignJustify,
    faPlusCircle,
    faMinusCircle,
    faTimes,
    faExpandAlt,
    faSearch,
} from "@fortawesome/free-solid-svg-icons";

import { AppNavBar, AppNavBarButtons } from "../components/navbar";
import CardInfo from "../components/cardinfo";
//import { edgePadding } from "../components/helpers";
import { BingoTile, BingoCard } from "../types";
import ApiRender from "../api/render";
import api from "../api/backend";
import debugLog from "../debug";

const isMobile = () => Boolean(navigator.maxTouchPoints);

//=============================//
// bingo card solution checker //
//=============================//

const solutionArrays = (() => {
    // Bingo card is 5 x 5, so can use the same length array
    // for all the dimensions.
    const side = Array(5).fill(0);

    const edge = side.map((_, i) => i);
    const vert = edge.map((n) => side.map((_, i) => i * 5 + n));
    const horiz = edge.map((n) => side.map((_, i) => i + 5 * n));
    const diag1 = side.map((_, i) => i * 4 + 4);
    const diag2 = side.map((_, i) => i * 6);

    return [...vert, ...horiz, diag1, diag2];
})();

type SolutionArray = BingoTile[];

const checkForBingo = (card: BingoCard): SolutionArray | undefined => {
    if (solutionArrays.some((line) => line.every((index) => card.tiles[index].clicked))) {
        const solution = solutionArrays.filter((line) => line.every((index) => card.tiles[index].clicked))[0];
        return solution.map((index) => card.tiles[index]);
    }
};

//==================//
// cardview methods //
//==================//

type CardSetter = (card: BingoCard) => void;
type SolutionSetter = (solution: SolutionArray) => void;

const tileHover = (tile: BingoTile, state: boolean, card: BingoCard, setCard: CardSetter) => {
    if (!isMobile()) {
        const tiles = card.tiles;
        const index = tiles.indexOf(tile);
        tiles[index].hovered = state;
        setCard({ ...card, tiles: tiles });
    }
};

const tileClick = (tile: BingoTile, card: BingoCard, setCard: CardSetter, setSolution: SolutionSetter) => {
    const tiles = card.tiles;
    const index = tiles.indexOf(tile);
    tiles[index].clicked = !tiles[index].clicked;
    setCard({ ...card, tiles: tiles });

    var newSolution = checkForBingo(card);
    if (newSolution) setSolution(newSolution);
};

const resetBingo = (card: BingoCard | null, setCard: CardSetter, setSolution: SolutionSetter) => {
    if (card) {
        const tiles = card.tiles.map((tile) => {
            tile.hovered = false;
            tile.clicked = false;
            return tile;
        });
        tiles[12].clicked = true;
        setCard({ ...card, tiles: tiles });
        setSolution([]);

        window.scrollTo({ top: 0, behavior: "smooth" });
    }
};

const clickedColor = "bg-sdark-green text-white";
const hoverColor = "bg-sdark-magenta text-white";

const tileColor = (tile: BingoTile, defaultColor: string = "sdark-fg") => {
    if (tile.clicked) return clickedColor;
    else if (tile.hovered) return hoverColor;
    else return defaultColor;
};

//====================//
// cardview component //
//====================//

interface CardLayoutProps {
    passedCard: BingoCard;
    cardInfo: ReactElement;
}

const CardLayout = ({ passedCard, cardInfo }: CardLayoutProps) => {
    const [card, setCard] = useState(() => {
        let tiles = passedCard.tiles.map((tile) => ({
            ...tile,
            hovered: false,
            clicked: false,
        }));
        tiles[12].clicked = true;
        passedCard.tiles = tiles;
        debugLog({ CARD: "init card" });
        return passedCard;
    });

    const filterTiles = () =>
        card.tiles.filter((tile) => {
            return tile.text.toLowerCase().includes(tileSearchQuery.toLowerCase());
        });

    const [tileSearchQuery, setTileSearchQuery] = useState("");
    const [solution, setSolution] = useState<SolutionArray>([]);
    const [topVisible, setTopVisible] = useState(true);
    const [overviewVisible, setOverviewVisible] = useState(true);
    const [gridMode, setGridMode] = useState(false);
    const [filteredTiles, setFilteredTiles] = useState<BingoTile[]>(filterTiles());

    useEffect(() => setFilteredTiles(filterTiles()), [tileSearchQuery]);

    const inputRef = useRef<HTMLInputElement>(null);
    const solved = Boolean(solution.length);

    const changeSearch = (e: any) => setTileSearchQuery(e.target.value);
    const resetSearch = () => {
        setTileSearchQuery("");
        setTopVisible(true);
    };
    const showTop = () => setTopVisible(true);
    const hideTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
        setTopVisible(false);
        inputRef.current && inputRef.current.focus();
    };

    const buttons: AppNavBarButtons = [[faSearch, "Search", hideTop]];
    if (!topVisible) buttons.push([faExpandAlt, "Expand", showTop]);

    debugLog({ CARD: "render", query: tileSearchQuery, solution, topVisible });

    const CollapseButton = () => (
        <div className="hover-white" onClick={() => setOverviewVisible(!overviewVisible)} style={{ cursor: "pointer" }}>
            <FaIcon icon={overviewVisible ? faMinusCircle : faPlusCircle} />
        </div>
    );

    const toggleClass = topVisible ? "" : "d-none d-lg-block";
    const overviewClass = overviewVisible ? "" : "d-none";
    const gridColSize = gridMode ? 12 : 7;
    const gridRowCols = gridMode ? 5 : 1;
    const gridInfoColSize = gridMode ? 6 : 5;
    const gridTileClass = gridMode ? "text-center p-3" : "p-2";
    const gridTileSize = gridMode ? 10 : 12;
    const gridSearchSize = gridMode ? 6 : 12;

    return (
        <>
            <Helmet>
                <title>{card.name}</title>
            </Helmet>
            <Row id="card-container" className="g-3 justify-content-lg-center">
                <Col id="hide-on-search" className={toggleClass} xs={12} lg={gridInfoColSize}>
                    <Row className="g-3">
                        <Col id="card-info" xs={12} className={toggleClass}>
                            {cardInfo}
                        </Col>
                        <Col id="toolbar" xs={12}>
                            <div className="rounded sdark-fg px-3 py-2">
                                <div className="d-flex flex-wrap">
                                    <div
                                        className={`rounded-pill me-2 px-3 py-1 ${
                                            overviewVisible ? "bg-sdark-orange text-white" : "sdark-bg"
                                        }`}
                                        onClick={() => setOverviewVisible(!overviewVisible)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <FaIcon icon={faEye} className="me-3" />
                                        Overview
                                    </div>
                                    {(
                                        [
                                            ["Row", faAlignJustify, false],
                                            ["Grid", faTh, true],
                                        ] as Array<[ReactNode, IconDefinition, boolean]>
                                    ).map(([label, icon, gridValue]) => {
                                        const color =
                                            gridValue === gridMode ? "bg-sdark-orange text-white" : "sdark-bg";
                                        const onClick = () => {
                                            setGridMode(gridValue);
                                            setOverviewVisible(!gridValue);
                                        };

                                        return (
                                            <div
                                                className={`d-none d-lg-block rounded-pill me-2 px-3 py-1 ${color}`}
                                                onClick={onClick}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <FaIcon icon={icon} className="me-3" />
                                                {label}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Col>
                        <Col id="overview" xs={12} className={overviewClass}>
                            {/*
                            <Row className="g-3">
                                <Col id="overview-header" xs={12}>
                                    <div className="rounded px-3 py-2 sdark-fg">
                                        <Row>
                                            <Col xs={2}>
                                                <div className="d-flex justify-content-center">
                                                    <CollapseButton />
                                                </div>
                                            </Col>
                                            <Col xs={10} className="ps-0">
                                                <b>Card Overview</b>
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                                <Col id="overview-body" xs={12} className={overviewClass}>
                                </Col>
                            </Row>
                                */}
                            <Row className="row-cols-5 g-2 text-center">
                                {card.tiles.map((tile, index) => (
                                    <Col>
                                        <div className={`py-2 rounded ${tileColor(tile, "sdark-fg")}`}>{index + 1}</div>
                                    </Col>
                                ))}
                            </Row>
                        </Col>
                    </Row>
                </Col>
                <Col id="tiles-and-search-bar" xs={12} lg={gridColSize}>
                    <Row className="g-3 justify-content-center">
                        <Col id="search-bar" xs={12} lg={gridSearchSize}>
                            <Row className="g-3">
                                <Col xs={12} className={"d-lg-none " + (topVisible ? "d-none" : "")}>
                                    <div className="px-3 py-2 rounded sdark-fg">
                                        <small>Card info hidden. Click on the expand button to show them.</small>
                                    </div>
                                </Col>
                                <Col xs={12}>
                                    <Row className="g-2">
                                        <Col>
                                            {/* Inputs can't be nested in another component */}
                                            <InputGroup>
                                                <InputGroup.Text>
                                                    <FaIcon icon={faSearch} />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    placeholder="Search bingo tiles"
                                                    type="string"
                                                    value={tileSearchQuery}
                                                    style={{ cursor: "pointer" }}
                                                    onChange={changeSearch}
                                                    onFocus={hideTop}
                                                    ref={inputRef}
                                                />
                                                {tileSearchQuery && (
                                                    <InputGroup.Text
                                                        onClick={resetSearch}
                                                        style={{ cursor: "pointer" }}
                                                        className="input-group-text-clear"
                                                    >
                                                        <FaIcon icon={faTimes} />
                                                    </InputGroup.Text>
                                                )}
                                            </InputGroup>
                                        </Col>
                                        {tileSearchQuery && (
                                            <Col xs={4} lg={3}>
                                                <div className="px-2 rounded bg-sdark-cyan text-white text-center h-100 d-flex align-items-center justify-content-center">
                                                    {`${filteredTiles.length || "No"} result` +
                                                        (filteredTiles.length === 1 ? "" : "s")}
                                                </div>
                                            </Col>
                                        )}
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                        <Col id="tiles" xs={12} lg={gridTileSize}>
                            <Row id="tile-rows" className={`g-2 row-cols-1 row-cols-lg-${gridRowCols}`}>
                                {filteredTiles.map((tile, index) => (
                                    <Col>
                                        <div
                                            style={{ cursor: "pointer" }}
                                            className={`rounded h-100 ${tileColor(tile)} ${gridTileClass}`}
                                            onClick={() => tileClick(tile, card, setCard, setSolution)}
                                            onMouseEnter={() => tileHover(tile, true, card, setCard)}
                                            onMouseLeave={() => tileHover(tile, false, card, setCard)}
                                        >
                                            <Row>
                                                <Col
                                                    xs={2}
                                                    lg={1}
                                                    className={`${tile.clicked || tile.hovered ? "" : "border-end"} ${
                                                        gridMode ? "d-none" : ""
                                                    }`}
                                                >
                                                    <div className="h-100 d-flex align-items-center justify-content-center">
                                                        {index + 1}
                                                    </div>
                                                </Col>
                                                <Col>
                                                    <div className="h-100">
                                                        {index === 1
                                                            ? "one"
                                                            : "Adipisicing exercitationem cum impedit natus consectetur."}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Col>
                    </Row>
                </Col>

                <Modal
                    show={solved}
                    dialogAs={(props) => (
                        <div className="modal-dialog modal-dialog-centered">
                            <div {...{ ...props, className: "modal-content rounded sdark-bg" }}></div>
                        </div>
                    )}
                >
                    <Modal.Header>You got Bingo!</Modal.Header>
                    <Modal.Body>
                        <div className="text-center mb-4 mt-3">
                            <h3>{card.name}</h3>
                        </div>
                        <Row className="row-cols-1 p-1">
                            {solution.map((tile, index) => (
                                <Col className="p-1">
                                    <Col className="rounded h-100 p-2 sdark-fg">
                                        <Row>
                                            <Col xs={2} md={1} className="border-sdark-right text-center">
                                                {index + 1}
                                            </Col>
                                            <Col>{tile.text}</Col>
                                        </Row>
                                    </Col>
                                </Col>
                            ))}
                        </Row>
                        <div className="text-center mt-4 mb-3">
                            Link:{" "}
                            <a href={window.location.href} className="sdark-bg">
                                {window.location.href}
                            </a>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={() => resetBingo(card, setCard, setSolution)}>
                            Start Over
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Row>

            <AppNavBar id="card-navbar" buttons={buttons} />
        </>
    );
};

interface CardIdParam {
    cardId: string;
}

const CardView = () => {
    const { cardId }: CardIdParam = useParams();
    return (
        <ApiRender
            key={cardId}
            apiCall={() => api.getCard(cardId)}
            loadingMessage={`Loading bingo card ${cardId}`}
            component={({ data }) => (
                <CardLayout passedCard={data} cardInfo={<CardInfo card={data} collapse={isMobile()} />} />
            )}
        />
    );
};

export default CardView;
