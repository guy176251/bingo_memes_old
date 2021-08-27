import { useState, useRef, ReactElement } from "react";
import { Helmet } from "react-helmet";

import { useParams } from "react-router-dom";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faExpandAlt, faSearch } from "@fortawesome/free-solid-svg-icons";

import { AppNavBar, AppNavBarButtons } from "../components/navbar";
import CardInfo from "../components/cardinfo";
import { edgePadding } from "../components/snippets";
import { BingoTile, BingoCard } from "../types";
import ApiRender from "../api/render";
import api from "../api/backend";
import debugLog from "../debug";

//=============================//
// bingo card solution checker //
//=============================//

const solutionIndexes = (() => {
    let edge = Array(5)
        .fill(0)
        .map((_, i) => i);
    let vert = edge.map((n) =>
        Array(5)
            .fill(0)
            .map((_, i) => i * 5 + n)
    );
    let horiz = edge.map((n) =>
        Array(5)
            .fill(0)
            .map((_, i) => i + 5 * n)
    );
    let diag1 = Array(5)
        .fill(0)
        .map((_, i) => i * 4 + 4);
    let diag2 = Array(5)
        .fill(0)
        .map((_, i) => i * 6);
    return [...vert, ...horiz, diag1, diag2];
})();

type SolutionArray = BingoTile[];

const checkForBingo = (card: BingoCard): SolutionArray | undefined => {
    if (solutionIndexes.some((line) => line.every((index) => card.tiles[index].clicked))) {
        var solution = solutionIndexes.filter((line) => line.every((index) => card.tiles[index].clicked))[0];
        return solution.map((index) => card.tiles[index]);
    }
};

//==================//
// cardview methods //
//==================//

type CardSetter = (card: BingoCard) => void;
type SolutionSetter = (solution: SolutionArray) => void;

const tileHover = (tile: BingoTile, state: boolean, card: BingoCard, setCard: CardSetter) => {
    if (!navigator.maxTouchPoints) {
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

const colorTheTile = (tile: BingoTile) => {
    if (tile.clicked) return clickedColor;
    else if (tile.hovered) return hoverColor;
    else return "sdark-fg";
};

//====================//
// cardview variables //
//====================//

const clickedColor = "bg-sdark-green text-white";
const hoverColor = "bg-sdark-magenta text-white";

//====================//
// cardview component //
//====================//

interface CardLayoutProps {
    passedCard: BingoCard;
    cardInfo: ReactElement;
}

const CardLayout = ({ passedCard, cardInfo }: CardLayoutProps) => {
    const [card, setCard] = useState(() => {
        /*
    let tileFields = Object.entries(passedCard).filter(([field, _]) =>
      field.startsWith("tile_")
    );
    let tiles = tileFields.map(([_, text], index) => ({
      text: text,
      hovered: false,
      clicked: false,
      id: index + 1,
    }));
    tileFields.forEach(([field, _]) =>
      Reflect.deleteProperty(passedCard, field)
    );
    */

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
    const [tileSearchQuery, setTileSearchQuery] = useState("");
    const [solution, setSolution] = useState<SolutionArray>([]);
    const [topToggled, setTopToggled] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const solved = Boolean(solution.length);

    const changeSearch = (e: any) => setTileSearchQuery(e.target.value);
    const resetSearch = () => {
        setTileSearchQuery("");
        setTopToggled(true);
    };
    const showTop = () => setTopToggled(true);
    const hideTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
        setTopToggled(false);
        inputRef.current && inputRef.current.focus();
    };
    const buttons: AppNavBarButtons = [[faSearch, "Search", hideTop]];
    if (!topToggled) buttons.push([faExpandAlt, "Expand", showTop]);

    const filteredTiles = card.tiles.filter((tile) => {
        return tile.text.toLowerCase().includes(tileSearchQuery.toLowerCase());
    });

    debugLog({ CARD: "render", query: tileSearchQuery, solution, topToggled });
    //`\nLAYOUT:\n\n    card: ${card.name}\n    query: ${tileSearchQuery}\n    solution: ${solution}\n    topToggled: ${topToggled}\n`

    return (
        <>
            <Helmet>
                <title>{card.name}</title>
            </Helmet>
            <Row className="pt-2">
                <Col id="info-and-indicators" xs={12} md={6} lg={5} className="px-2">
                    <div id="card-info" className={"pb-2 " + (topToggled ? "" : "d-none d-md-block")}>
                        <div className="mb-2">{cardInfo}</div>
                        <Col id="indicators" className="text-center">
                            <Row className="row-cols-5">
                                {card.tiles.map((tile, index) => (
                                    <Col className={`p-0 ${edgePadding[index]}`}>
                                        <Col className={`py-2 rounded ${colorTheTile(tile)}`}>{index + 1}</Col>
                                    </Col>
                                ))}
                            </Row>
                        </Col>
                    </div>
                    <div id="search-bar" className="pb-2">
                        {!topToggled && (
                            <div className="d-md-none text-sdark-bg p-0 pb-1">
                                <small>Card info hidden. Click on the expand button to show them.</small>
                            </div>
                        )}
                        <InputGroup>
                            <Form.Control
                                placeholder="Search bingo tiles"
                                type="string"
                                className="slight-bg"
                                value={tileSearchQuery}
                                style={{ cursor: "pointer" }}
                                onChange={changeSearch}
                                onFocus={hideTop}
                                ref={inputRef}
                            />
                            {tileSearchQuery && (
                                <InputGroup.Text onClick={resetSearch} style={{ cursor: "pointer" }}>
                                    {/*
                                    <Button variant="danger" className="bg-sdark-red" onClick={resetSearch}>
                                    </Button>
                                    */}
                                    <FontAwesomeIcon icon={faTimes} />
                                </InputGroup.Text>
                            )}
                        </InputGroup>
                    </div>
                </Col>
                <Col id="tiles" xs={12} md={6} lg={7} className="px-2">
                    {tileSearchQuery && (
                        <div className={"text-sdark-bg text-center p-0 " + (filteredTiles.length ? "pb-3" : "")}>
                            {filteredTiles.length
                                ? `${filteredTiles.length} result` + (filteredTiles.length > 1 ? "s" : "")
                                : "No results"}
                        </div>
                    )}
                    <Row className="row-cols-1 row-cols-md-1">
                        {filteredTiles.map((tile, index) => (
                            <Col className={index === 0 ? "pb-1" : "py-1"}>
                                <Col
                                    style={{ cursor: "pointer" }}
                                    className={`rounded h-100 py-2 ${colorTheTile(tile)}`}
                                    onClick={() => tileClick(tile, card, setCard, setSolution)}
                                    onMouseEnter={() => tileHover(tile, true, card, setCard)}
                                    onMouseLeave={() => tileHover(tile, false, card, setCard)}
                                >
                                    <Row>
                                        <Col
                                            xs={2}
                                            lg={1}
                                            className={
                                                "border" +
                                                (tile.hovered || tile.clicked ? "" : "-sdark") +
                                                "-right" +
                                                " text-center"
                                            }
                                        >
                                            {index + 1}
                                        </Col>
                                        <Col>{tile.text}</Col>
                                    </Row>
                                </Col>
                            </Col>
                        ))}
                    </Row>
                    <hr className="sdark-hr" />
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
            component={({ data }) => <CardLayout passedCard={data} cardInfo={<CardInfo card={data} />} />}
        />
    );
};
/*
    const loc = useLocation();
    const card = 
        loc.state
            ? (loc.state as { card?: BingoCard }).card
            : null;

    return (
        <>
            {
                card
                    ? <CardLayout
                            passedCard={card}
                            cardInfo={<CardInfo card={card}/>}
                        />

                    : <ApiRender
                            apiCall={() => api.getCard(cardId)}
                            loadingMessage={`Loading bingo card ${cardId}`}
                            component={({ data }) => (
                                <CardLayout
                                    passedCard={data}
                                    cardInfo={<CardInfo card={data}/>}
                                />
                            )}
                        />
            }
        </>
    );
}
*/

export default CardView;
