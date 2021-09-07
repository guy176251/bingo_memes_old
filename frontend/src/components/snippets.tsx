import { ReactNode, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
//import { FontAwesomeIcon as FaIcon } from "@fortawesome/react-fontawesome";
//import { faHeart } from "@fortawesome/free-solid-svg-icons";
import api, { ApiResponse } from "../api/backend";
import { useAuth } from "../auth";
import { Category } from "../types";

interface HeaderProps {
    card?: boolean;
    children: ReactNode;
}

export const Header = ({ card, children }: HeaderProps) => (
    <div className="row">
        <div className="w-100">
            <div className="row">
                <div className="col-2 d-none d-lg-block" />
                <div className="col-12 col-lg-8">
                    <div>
                        {card ? <div className="py-4 text-center rounded sdark-fg m-2">{children}</div> : children}
                    </div>
                </div>
                <div className="col-2 d-none d-lg-block" />
            </div>
        </div>
    </div>
);

interface InfoHeaderProps {
    subject: string;
    info: ReactNode[];
}

const infoPadding = (index: number, max: number) => {
    switch (index) {
        case 0:
            return `pb-${gridPadding}`;
        case max:
            return `pt-${gridPadding}`;
        default:
            return `py-${gridPadding}`;
    }
};

const gridPadding = 1;
export const headerItem = "rounded text-center sdark-fg p-3 w-100";
export const centeredItem = "h-100 d-flex align-items-center justify-content-center";

export const InfoHeader = ({ subject, info }: InfoHeaderProps) => (
    <Header>
        <div className="p-2">
            <div className="row">
                <div className={`col-8 pe-${gridPadding}`}>
                    <div className={`${centeredItem} ${headerItem}`}>
                        <h3>{subject}</h3>
                    </div>
                </div>
                <div className={`col-4 ps-${gridPadding}`}>
                    <div>
                        <div className="col">
                            {info.map((tidbit, index) => (
                                <div className={`row ${infoPadding(index, info.length - 1)}`}>
                                    <div className={`${headerItem} w-100`}>{tidbit}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-2 px-2 d-none">
            <div className="row">
                <div className={`col pb-${gridPadding}`}>
                    <div className={headerItem}>
                        <div className="p-2">
                            <h2>{subject}</h2>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row row-cols-2">
                {info.map((tidbit, index) => (
                    <div className={`col py-${gridPadding} ${index % 2 === 0 ? "pr" : "pl"}-${gridPadding}`}>
                        <div className={`${centeredItem} ${headerItem}`}>{tidbit}</div>
                    </div>
                ))}
            </div>
        </div>
    </Header>
);

interface SubscribeButtonProps {
    subbed: boolean | null;
    apiCall: () => Promise<ApiResponse>;
}

export const SubscribeButton = ({ subbed, apiCall }: SubscribeButtonProps) => {
    const [subState, setSubbed] = useState(subbed);
    const { ifAuth } = useAuth();

    return (
        <Button
            variant={subState ? "secondary" : "danger"}
            className="rounded-pill"
            onClick={() =>
                ifAuth(() => {
                    setSubbed(!subState);
                    apiCall();
                })
            }
        >
            {subState ? "Subscribed" : "Subscribe"}
        </Button>
    );
};

interface HashtagButtonProps {
    name: string;
    category: Category;
    color?: string;
}

export const HashtagButton = ({ category, name }: HashtagButtonProps) => {
    const history = useHistory();

    return (
        <Button
            variant="primary"
            className="text-white rounded-pill py-1"
            onClick={() => history.push(`/categories/${category.name}/?hashtag=${name}`)}
        >
            #{name}
        </Button>
    );
};

interface CategoryListProps {
    categories: Category[];
}

export const CategoryList = ({ categories }: CategoryListProps) => {
    return (
        <Col>
            {categories.map((category) => (
                <Row>
                    <Col className="my-2">
                        <Row>
                            <Col xs={2}>
                                <div
                                    className="rounded-circle p-4"
                                    style={{
                                        backgroundImage: `url("${category.icon_url}")`,
                                        backgroundPosition: "center",
                                        backgroundSize: "cover",
                                        //width: "40px",
                                        //width: "40px",
                                        //height: "40px",
                                    }}
                                ></div>
                            </Col>
                            <Col>
                                <small>
                                    <Link to={`/categories/${category.name}`}>
                                        <b>{category.name}</b>
                                    </Link>
                                    <p>
                                        {category.subscriber_count} Subscriber
                                        {category.subscriber_count === 1 ? "" : "s"}
                                    </p>
                                </small>
                            </Col>
                            <Col className="pe-0">
                                <SubscribeButton
                                    subbed={category.is_subscribed}
                                    apiCall={() => api.createSubscription({ id: category.id })}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            ))}
        </Col>
    );
};
