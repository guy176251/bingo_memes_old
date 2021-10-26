import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Field, FieldProps, Form, Formik, FormikHelpers } from "formik";
import React, { createContext, forwardRef, useContext, useReducer, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";
import FormControl from "react-bootstrap/FormControl";
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row";
import { useHistory, useParams } from "react-router-dom";
import * as Yup from "yup";
import api from "../api/backend";
import ApiRender from "../api/render";
import { tileFieldNames, useCardSchema } from "../components/cardschema";
import Loading from "../components/loading";
import { Header } from "../components/snippets";
import debugLog from "../debug";
import { BingoCard, CardSchema, Category, ObjectArray } from "../types";

interface FormHelperProps {
    setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => void;
    values: { [x: string]: any };
    card?: BingoCard;
    category?: Category;
    isSubmitting?: boolean;
    dirty?: boolean;
    cardSchema?: Yup.SchemaOf<CardSchema>;
}

const FormHelperContext = createContext<FormHelperProps>({
    setFieldValue: () => {},
    values: {},
});

const CategorySearchBar = () => {
    // 1. State Handling
    // 2. Sub-Elements
    // 3. Main Element

    // ============================================================================
    // ========================= 1. State Handling ================================
    // ============================================================================

    /*
     
    if query is blank, hide dropdown
    when typing is done, show dropdown bc category create OR get
    onToggle should toggle dropdown

    */

    type Action =
        | { type: "query"; payload: string }
        | { type: "dropdown"; payload: boolean }
        | { type: "menuSelect"; payload: { query: string; errors: Array<string> } }
        | { type: "category"; payload: Category[] }
        | { type: "load"; payload: boolean };

    type State = {
        query: string;
        errors: Array<string>;
        showDropdown: boolean;
        loading: boolean;
        disabled: boolean;
        categories: Category[];
    };

    // has to be defined before the reducer in order to work for some reason
    const checkIfInputStopped = () => {
        // hack that checks if input has stopped for at least 500 ms
        setTimeout(() => {
            debugLog({ CATEGORYSEARCHBAR: "input check", query, queryRef });
            if (query && query === queryRef.current) {
                debugLog("searching for categories...");
                getCategories();
            }
        }, 500);
    };

    const stateReducer = (state: State, action: Action): State => {
        debugLog({ CATEGORYSEARCHBAR: "reducer", state, action });
        switch (action.type) {
            case "query":
                checkIfInputStopped();
                return {
                    ...state,
                    query: action.payload,
                    showDropdown: false,
                    disabled: state.disabled ? action.payload.length > 0 : false,
                    errors: action.payload.length > 0 ? state.errors : [],
                };
            case "dropdown":
                return {
                    ...state,
                    showDropdown: action.payload,
                };
            case "category":
                return {
                    ...state,
                    showDropdown: true,
                    loading: false,
                    categories: action.payload,
                };
            case "menuSelect": {
                const categoryValue = action.payload.errors.length > 0 ? "" : action.payload.query;
                setFieldValue("category", categoryValue);
                return {
                    ...state,
                    disabled: Boolean(action.payload.query.length > 0),
                    query: action.payload.query,
                    errors: action.payload.errors,
                };
            }
            case "load":
                return {
                    ...state,
                    showDropdown: !action.payload,
                    loading: action.payload,
                };
        }
    };

    const { setFieldValue, values, card, category, cardSchema } = useContext(FormHelperContext);
    const categoryName: string = values.category;
    const initState: State = {
        query: categoryName,
        showDropdown: false,
        loading: false,
        disabled: Boolean(categoryName.length > 0),
        errors: [],
        categories: [],
    };

    const [{ disabled, errors, query, showDropdown, loading, categories }, dispatch] = useReducer(
        stateReducer,
        initState
    );
    const valid = errors.length === 0;
    const showQueryButton = disabled && valid;
    const queryRef = useRef(query);
    queryRef.current = query;

    debugLog({
        CATEGORYSEARCHBAR: "states",
        query,
        disabled,
        errors,
        categoryName,
    });

    const getCategories = async () => {
        dispatch({ type: "load", payload: true });
        const { data, ok } = await api.getTopThreeCategories(query);
        if (ok && data) {
            debugLog(data);
            dispatch({ type: "category", payload: data });
        } else {
            dispatch({ type: "load", payload: false });
        }
    };

    const handleSelect = (eventKey: string | null) => {
        let errs: Array<string> = [];

        switch (eventKey) {
            case null:
                break;
            case "QUERY!":
                try {
                    cardSchema?.validateSync({ category: query });
                } catch (err: any) {
                    errs = err.errors;
                }
                dispatch({ type: "menuSelect", payload: { query, errors: errs } });
                break;
            default:
                dispatch({
                    type: "menuSelect",
                    payload: { query: eventKey, errors: errs },
                });
        }
    };

    // ============================================================================
    // ========================= 2. Sub-Elements ==================================
    // ============================================================================

    const LoadingIndicator = () => (
        <>
            {loading && (
                <InputGroup.Text>
                    <div className="ps-2">
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                </InputGroup.Text>
            )}
        </>
    );

    const ClearButton = () => (
        <>
            {!showQueryButton && query.length > 0 && (
                <InputGroup.Text style={{ cursor: "pointer" }} onClick={() => dispatch({ type: "query", payload: "" })}>
                    <FontAwesomeIcon icon={faTimes} />
                </InputGroup.Text>
            )}
        </>
    );

    const QueryButton = () => (
        <>
            {showQueryButton && (
                <InputGroup.Text className="m-1 text-white bg-sdark-violet border-0 rounded">
                    <Row>
                        <Col className={card || category ? "" : "pe-2"}>{query}</Col>
                        {!card && !category && (
                            <Col className="ps-2">
                                <div
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        dispatch({
                                            type: "menuSelect",
                                            payload: { query: "", errors: [] },
                                        })
                                    }
                                >
                                    <small>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </small>
                                </div>
                            </Col>
                        )}
                    </Row>
                </InputGroup.Text>
            )}
        </>
    );

    const DropdownItems = () => (
        <>
            <Dropdown.Item className="slight-bg" disabled>
                Select one
            </Dropdown.Item>
            <Dropdown.Divider className="border-slight-top" />
            {categories.length > 0 ? (
                categories.map((category) => (
                    <Dropdown.Item className="slight-bg" eventKey={category.name}>
                        {category.name}
                    </Dropdown.Item>
                ))
            ) : (
                <Dropdown.Item className="slight-bg" eventKey="QUERY!">
                    Create new category: {query}
                </Dropdown.Item>
            )}
        </>
    );

    const CategoryErrors = () => (
        <>
            {errors.length > 0 &&
                query.length > 0 &&
                errors.map((err) => (
                    <div className="text-sdark-red">
                        <small>{err}</small>
                    </div>
                ))}
        </>
    );

    // ============================================================================
    // ========================= 3. Main Element ==================================
    // ============================================================================

    const DropdownContainer = forwardRef(({ children }: any, ref: any) => <div ref={ref}>{children}</div>);

    return (
        <Dropdown
            show={showDropdown}
            onToggle={() => dispatch({ type: "dropdown", payload: !showDropdown })}
            onSelect={handleSelect}
        >
            <InputGroup className="slight-bg rounded">
                <InputGroup.Text className={disabled ? (valid ? "success" : "error") : ""}>Category</InputGroup.Text>
                <QueryButton />
                <input
                    disabled={showQueryButton}
                    type="text"
                    className="form-control"
                    placeholder={showQueryButton ? "" : "Search"}
                    value={showQueryButton ? "" : query}
                    onChange={(e) => dispatch({ type: "query", payload: e.target.value })}
                />
                <ClearButton />
                <LoadingIndicator />
            </InputGroup>

            <div>
                <CategoryErrors />
            </div>

            <Dropdown.Toggle as={DropdownContainer} id="create-category" />
            <Dropdown.Menu className="w-100 slight-bg mt-1 px-2">
                <DropdownItems />
            </Dropdown.Menu>
        </Dropdown>
    );
};

interface FormRowProps {
    name: string;
    label: string;
    small?: boolean;
    hidden?: boolean;
    disabled?: boolean;
}

const FormRowIndicator = ({ name, label }: FormRowProps) => (
    <Field name={name}>
        {({ meta }: FieldProps) =>
            !meta.touched ? (
                <div className="rounded text-center py-2 sdark-fg">{label}</div>
            ) : (
                <div className={`rounded text-center py-2 text-white bg-sdark-${meta.error ? "red" : "green"}`}>
                    {label}
                </div>
            )
        }
    </Field>
);

const FormRow = ({ name, label, disabled }: FormRowProps) => (
    <Field name={name}>
        {({ field, meta }: FieldProps) => {
            const prependColor = meta.touched ? (meta.error ? "error" : "success") : disabled ? "disabled" : "";

            return (
                <>
                    <InputGroup>
                        <InputGroup.Text className={prependColor}>{label}</InputGroup.Text>
                        <FormControl {...field} type="text" placeholder="Empty" disabled={disabled} />
                    </InputGroup>
                    {meta.touched && meta.error && (
                        <div className="text-sdark-red">
                            <small>{meta.error}</small>
                        </div>
                    )}
                </>
            );
        }}
    </Field>
);
const preventEnter = (keyEvent: React.KeyboardEvent<HTMLFormElement>) => {
    if (keyEvent.key === "Enter") {
        keyEvent.preventDefault();
    }
};

const CardForm = () => {
    const { card, category, isSubmitting } = useContext(FormHelperContext);
    const headerText = card
        ? `Editing "${card.name}"`
        : `Create New Bingo Card ${category ? `In ${category.name}` : ""}`;

    return (
        <Form onKeyDown={preventEnter}>
            <Row className="g-3 justify-content-center">
                <Col xs={12}>
                    <Row className="g-3">
                        <Col id="form-header-spacer" xs={2} className="d-none d-lg-block"></Col>
                        <Col xs={12} lg={8}>
                            <div className="rounded p-4 sdark-fg text-center">
                                <h2 className="m-0">{headerText}</h2>
                            </div>
                        </Col>
                        <Col id="form-header-spacer" xs={2} className="d-none d-lg-block"></Col>
                    </Row>
                </Col>
                <Col xs={12} lg={5}>
                    <Row className="g-3">
                        <Col xs={12}>
                            <FormRow name="name" label="Name" disabled={Boolean(card)} />
                        </Col>
                        <Col xs={12}>
                            <CategorySearchBar />
                        </Col>
                        <Col xs={12}>
                            <Row id="form-indicators" className="row-cols-5 g-2">
                                {tileFieldNames.map((field, index) => (
                                    <Col>
                                        <FormRowIndicator name={field} label={`${index + 1}`} />
                                    </Col>
                                ))}
                            </Row>
                        </Col>
                        <Col xs={12}>
                            <Button variant="primary" type="submit" disabled={isSubmitting} className="text-white">
                                Submit
                            </Button>
                        </Col>
                    </Row>
                </Col>
                <Col xs={12} lg={7}>
                    <Row id="form-tiles" className="g-2">
                        {tileFieldNames.map((field, index) => (
                            <Col xs={12}>
                                <FormRow name={field} label={`Tile ${index + 1}`} />
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>
        </Form>
    );
};

const CardCreateEditLayout = ({ card, category }: { card?: BingoCard; category?: Category }) => {
    const [success, setSuccess] = useState(false);
    const history = useHistory();
    const { cardSchema, valuesToAPI } = useCardSchema(card, category);

    const submitCard = async (values: CardSchema, { setErrors, resetForm }: FormikHelpers<any>) => {
        let apiCall = card ? (v: any) => api.editCard(card.id, v) : (v: any) => api.createCard(v);
        let { data, ok } = await apiCall(valuesToAPI(values));

        if (!ok && data) {
            setErrors(
                Object.fromEntries(Object.entries(data as ObjectArray<string[]>).map(([field, err]) => [field, err[0]]))
            );
        } else if (ok && !card) {
            resetForm();
        }

        //debugLog({ CARDCREATE: "submitted card", data, ok });
        setSuccess(ok);
        return;
    };

    debugLog({ CARDCREATE: "layout render" });

    const formVerb = card ? "edit" : "creat";
    const formVerbCap = formVerb.charAt(0).toUpperCase() + formVerb.slice(1);

    return success ? (
        <Header card>
            <h2 className="mb-4">Successfully {formVerb}ed bingo card!</h2>
            <button className="btn btn-primary" onClick={() => history.go(-1)}>
                Go Back
            </button>
        </Header>
    ) : (
        <div className="px-2">
            <Formik validationSchema={cardSchema} initialValues={cardSchema.getDefault() as any} onSubmit={submitCard}>
                {({ isSubmitting, setFieldValue, values, dirty }) => (
                    <FormHelperContext.Provider
                        value={{ cardSchema, setFieldValue, values, card, category, isSubmitting, dirty }}
                    >
                        {isSubmitting ? <Loading message={`${formVerbCap}ing new bingo card...`} /> : <CardForm />}
                    </FormHelperContext.Provider>
                )}
            </Formik>
        </div>
    );
};

interface CardCreateParams {
    cardId?: string;
    categoryName?: string;
}

const CardCreateView = () => {
    const { cardId, categoryName } = useParams<CardCreateParams>();
    debugLog({ CARDCREATE: "init", cardId, categoryName });

    return cardId ? (
        <ApiRender
            apiCall={() => api.getCard(cardId)}
            component={({ data }) => <CardCreateEditLayout card={data} />}
            key={cardId}
        />
    ) : categoryName ? (
        <ApiRender
            apiCall={() => api.getCategory(categoryName)}
            component={({ data }) => <CardCreateEditLayout category={data} />}
            key={categoryName}
        />
    ) : (
        <CardCreateEditLayout />
    );
};

export default CardCreateView;
