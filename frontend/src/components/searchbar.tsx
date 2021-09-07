import { ReactElement, useReducer, useRef, forwardRef, ReactNode } from "react";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownItem from "react-bootstrap/DropdownItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { ApiResponse } from "../api/backend";
import debugLog from "../debug";

const DropdownContainer = forwardRef(({ children }: any, ref: any) => <div ref={ref}>{children}</div>);

interface SearchBarProps {
    label: ReactNode;
    apiCall: (query: string) => Promise<ApiResponse<any[]>>;
    //resultMapper: (result: any) => ReactElement<DropdownItem>;
    resultMapper: (result: any[], query: string) => ReactElement<any>[];
}

const SearchBar = ({ label, apiCall, resultMapper }: SearchBarProps) => {
    // 1. StateHandling
    // 2. SubElements
    // 3. MainElement

    // ============================================================================
    // ========================= 1. StateHandling ================================
    // ============================================================================

    /*
     
    if query is blank, hide dropdown
    when typing is done, show dropdown after api call
    onToggle should obv toggle dropdown

    */

    // has to be defined before the reducer in order to work for some reason
    const checkIfInputStopped = () => {
        // hack that checks if input has stopped for at least 500 ms
        setTimeout(() => {
            debugLog({ SEARCHBAR: "input check", label, query, queryRef });
            if (query && query === queryRef.current) {
                debugLog("searching for searchResults...");
                getResults();
            }
        }, 500);
    };

    type Action =
        | { type: "query"; payload: string }
        | { type: "dropdown"; payload: boolean }
        | { type: "menuSelect"; payload: { query: string } }
        | { type: "results"; payload: any[] }
        | { type: "load"; payload: boolean };

    type State = {
        query: string;
        showDropdown: boolean;
        loading: boolean;
        disabled: boolean;
        searchResults: any[];
    };

    const stateReducer = (state: State, action: Action): State => {
        debugLog({ SEARCHBAR: "reducer", label, state, action });
        switch (action.type) {
            case "query":
                checkIfInputStopped();
                return {
                    ...state,
                    query: action.payload,
                    showDropdown: false,
                    disabled: state.disabled ? action.payload.length > 0 : false,
                };
            case "dropdown":
                return {
                    ...state,
                    showDropdown: action.payload,
                };
            case "results":
                return {
                    ...state,
                    showDropdown: true,
                    loading: false,
                    searchResults: action.payload,
                };
            case "menuSelect":
                return {
                    ...state,
                    disabled: Boolean(action.payload.query.length > 0),
                    query: action.payload.query,
                };
            case "load":
                return {
                    ...state,
                    showDropdown: !action.payload,
                    loading: action.payload,
                };
        }
    };

    const initState: State = {
        query: "",
        showDropdown: false,
        loading: false,
        disabled: false,
        searchResults: [],
    };

    const [{ disabled, query, showDropdown, loading, searchResults }, dispatch] = useReducer(stateReducer, initState);
    const showQueryButton = disabled;
    const queryRef = useRef(query);
    queryRef.current = query;

    debugLog({ SEARCHBAR: "states", label, query, disabled });

    const getResults = async () => {
        dispatch({ type: "load", payload: true });
        let { data, ok } = await apiCall(query);
        if (ok && data) {
            debugLog(data);
            dispatch({ type: "results", payload: data });
        } else {
            dispatch({ type: "load", payload: false });
        }
    };

    // ============================================================================
    // ========================= 2. SubElements ==================================
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
                <InputGroup.Text
                    style={{ cursor: "pointer" }}
                    onClick={() => dispatch({ type: "query", payload: "" })}
                    className="input-group-text-clear"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </InputGroup.Text>
            )}
        </>
    );

    /*
    const DropdownItems = () => (
        <>
            <Dropdown.Item className='slight-bg' disabled>
                Select one
            </Dropdown.Item>
            <Dropdown.Divider className='border-slight-top'/>
            {searchResults.length > 0
                ?
                    searchResults.map(resultMapper)

                :  
                    <Dropdown.Item className='slight-bg' disabled>
                        No results found
                    </Dropdown.Item>}
        </>
    );
     */

    const DropdownItems = () => <>{resultMapper(searchResults, query)}</>;

    const SearchBarLabel = () => (
        <div className="input-group-prepend">
            <span className="input-group-text">{label}</span>
        </div>
    );

    // ============================================================================
    // ========================= 3. MainElement ==================================
    // ============================================================================

    return (
        <Dropdown
            show={showDropdown}
            onToggle={() => dispatch({ type: "dropdown", payload: !showDropdown })}
            onSelect={() => dispatch({ type: "query", payload: "" })}
        >
            <InputGroup className="rounded">
                <InputGroup.Text>{label}</InputGroup.Text>
                <FormControl
                    placeholder={showQueryButton ? "" : "Search"}
                    disabled={showQueryButton}
                    value={showQueryButton ? "" : query}
                    type="text"
                    onChange={(e) => dispatch({ type: "query", payload: e.target.value })}
                ></FormControl>
                <ClearButton />
                <LoadingIndicator />
            </InputGroup>

            {/*
            <div className="input-group rounded">
                <label className="input-group-text">{label}</label>
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
            </div>
            */}

            <Dropdown.Toggle as={DropdownContainer} id={`search-bar-${label}`} />
            <Dropdown.Menu className="w-100 slight-bg mt-1 px-2">
                <DropdownItems />
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default SearchBar;
