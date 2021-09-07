import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { ReactElement } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { Location } from "history";
import Dropdown from "react-bootstrap/Dropdown";
import { FontAwesomeIcon as FaIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition, faFire, faSun, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import debugLog from "../debug";

interface PaginationProps {
    itemCount: number;
    pageSize: number;
    label: string;
    top?: boolean;
}

const Pagination = ({ pageSize, itemCount, label, top = false }: PaginationProps) => {
    const buttonShape = "w-100 rounded p-2 text-center";
    const pageCount = Math.ceil(itemCount / pageSize);

    const loc = useLocation();
    const paginationUrl = loc.pathname;
    const urlParams = new URLSearchParams(loc.search);
    const currentSort = getDefaultSort(urlParams);
    const pageNum = parseInt(urlParams.get("page") || "1");
    urlParams.delete("page");
    const urlParamsString = urlParams.toString();

    const PageItem = ({ index = 0 }: { index?: number }) => {
        const color = index === pageNum ? "bg-sdark-orange text-white" : "sdark-fg";

        const innerButton = (
            <div className={`${buttonShape} ${color} ${index ? "page-btn" : ""}`}>{index ? index : "..."}</div>
        );

        let button: ReactElement;

        if (index && index !== pageNum) {
            let params = new URLSearchParams(urlParamsString);
            params.set("page", `${index}`);
            button = <Link to={`${paginationUrl}?${params.toString()}`}>{innerButton}</Link>;
        } else {
            button = innerButton;
        }

        return button;
    };

    const sortDropdown = (
        <Dropdown>
            <Dropdown.Toggle id="sort-dropdown" className={`sdark-fg border-0 p-0 w-100 ${buttonShape}`}>
                sort: {currentSort}
            </Dropdown.Toggle>

            <Dropdown.Menu className="w-100 slight-bg">
                <Dropdown.ItemText>Sort by</Dropdown.ItemText>
                <Dropdown.Divider />
                {Object.keys(orderingParams)
                    .filter((option) => option !== currentSort)
                    .map((option) => {
                        urlParams.set("sort", option);
                        return (
                            <Dropdown.Item as={Link} to={`${paginationUrl}?${urlParams.toString()}`}>
                                {option}
                            </Dropdown.Item>
                        );
                    })}
            </Dropdown.Menu>
        </Dropdown>
    );

    const PageButtons = ({ rowSize }: { rowSize: number }) => {
        let paginationItems: (number | null)[] = pagination(pageNum, pageCount);

        if (paginationItems.length < rowSize)
            Array(rowSize - paginationItems.length)
                .fill(null)
                .forEach((thing) => paginationItems.push(thing));

        const endIndex = rowSize - 1;

        return (
            <Row className={`g-2 row-cols-${rowSize}`}>
                {paginationItems.map((item, index) => (
                    <Col>{item !== null && <PageItem index={item} />}</Col>
                ))}
            </Row>
        );
    };

    const InfoCluster = () => (
        <Row>
            <Col xs={4} className="p-0 pe-1">
                <div className={`sdark-fg ${buttonShape}`}>Page {pageNum}</div>
            </Col>
            <Col xs={4} className="px-1">
                <div className={`sdark-fg ${buttonShape}`}>
                    {itemCount} {label}
                </div>
            </Col>
            <Col xs={4} className="ps-1 p-0">
                {sortDropdown}
            </Col>
        </Row>
    );

    /*
    const SortRow = () => {
        const sortParams = new URLSearchParams(loc.search);
        sortParams.delete("page");
        const currentSortIndicator = "rounded-pill sdark-bg";

        return (
            <Row className="rounded p-2 sdark-fg">
                <Col xs={5}>
                    <Row>
                        {Object.entries(orderingParams).map(([n, q]) => {
                            sortParams.set("sort", n);
                            return (
                                <Col className="px-2">
                                    <div className={`p-2 text-center ${n === currentSort ? currentSortIndicator : ""}`}>
                                        <Link to={`${paginationUrl}?${sortParams.toString()}`}>
                                            <p className="text-capitalize m-0">
                                                <FaIcon icon={orderingIcons[n]} className="me-2" />
                                                {n}
                                            </p>
                                        </Link>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </Col>
            </Row>
        );
    };
    */

    const SortNav = () => {
        const sortParams = new URLSearchParams(loc.search);
        sortParams.delete("page");
        const currentSortIndicator = "rounded-pill sdark-bg";

        return (
            <div className="rounded py-2 px-3 sdark-fg">
                <Navbar variant="dark" className="p-0">
                    <Nav>
                        {Object.entries(orderingParams).map(([n, q]) => {
                            sortParams.set("sort", n);
                            return (
                                <Nav.Item className={`px-2 me-2 ${n === currentSort ? currentSortIndicator : ""}`}>
                                    <Nav.Link as={Link} to={`${paginationUrl}?${sortParams.toString()}`}>
                                        <p className="text-capitalize m-0">
                                            <FaIcon icon={orderingIcons[n]} className="me-3" />
                                            {n}
                                        </p>
                                    </Nav.Link>
                                </Nav.Item>
                            );
                        })}
                    </Nav>
                </Navbar>
            </div>
        );
    };

    const DefaultPageButtons = () => <PageButtons rowSize={7} />;

    return top ? <SortNav /> : <DefaultPageButtons />;

    //return (
    //    <>
    //        {/* mobile */}
    //        <div className="d-lg-none">
    //            <Row>
    //                {top && (
    //                    <Col xs={12}>
    //                        <div className="pb-2">{infoCluster}</div>
    //                        <div className="pt-2"></div>
    //                    </Col>
    //                )}
    //                <Col xs={12}>{pageButtons}</Col>
    //            </Row>
    //        </div>

    //        {/* desktop */}
    //        <div className="d-none d-lg-block">
    //            <Row>
    //                <Col xs={6}>
    //                    <div className="pe-2">{pageButtons}</div>
    //                </Col>
    //                {top && (
    //                    <Col xs={6}>
    //                        <div className="ps-2">{infoCluster}</div>
    //                    </Col>
    //                )}
    //            </Row>
    //        </div>
    //    </>
    //);
};
const getDefaultSort = (params: URLSearchParams) => params.get("sort") || "hot";
const orderingParams: { [s: string]: string } = {
    hot: "-hot,-best,-created_at",
    new: "-created_at",
    best: "-best,-created_at",
};
const orderingIcons: { [s: string]: IconDefinition } = {
    hot: faFire,
    new: faSun,
    best: faArrowUp,
};

const getRange = (start: number, end: number) => {
    return Array(end - start + 1)
        .fill(0)
        .map((_, i) => i + start);
};

const pagination = (currentPage: number, pageCount: number) => {
    let delta: number;
    if (pageCount <= 7) {
        // delta === 7: [1 2 3 4 5 6 7]
        delta = 7;
    } else {
        // delta === 2: [1 ... 4 5 6 ... 10]
        // delta === 4: [1 2 3 4 5 ... 10]
        delta = currentPage > 4 && currentPage < pageCount - 3 ? 2 : 4;
    }

    const range = {
        start: Math.round(currentPage - delta / 2),
        end: Math.round(currentPage + delta / 2),
    };

    if (range.start - 1 === 1 || range.end + 1 === pageCount) {
        range.start += 1;
        range.end += 1;
    }

    let pages: number[] =
        currentPage > delta
            ? getRange(Math.min(range.start, pageCount - delta), Math.min(range.end, pageCount))
            : getRange(1, Math.min(pageCount, delta + 1));

    const withDots = (value: number, pair: number[]) => (pages.length + 1 !== pageCount ? pair : [value]);

    if (pages[0] !== 1) {
        let wd = withDots(1, [1, 0]);
        debugLog({ FIRST: "", wd, pages });
        pages = [...wd, ...pages];
    }

    if (pages[pages.length - 1] < pageCount) {
        let wd = withDots(pageCount, [0, pageCount]);
        debugLog({ SECOND: "", wd, pages });
        pages = [...pages, ...wd];
    }

    return pages;
};

export default Pagination;

export const toApiQuery = (location: Location, query: object = {}) => {
    let urlParams = new URLSearchParams(location.search);
    urlParams.set("ordering", orderingParams[getDefaultSort(urlParams)]);
    urlParams.delete("sort");

    Object.entries(query).forEach(([key, value]) => urlParams.set(key, value));

    return urlParams.toString();
};
