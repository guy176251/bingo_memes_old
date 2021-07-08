import { createContext, useContext, forwardRef, useState, useRef, useReducer } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Dropdown from 'react-bootstrap/Dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FieldProps, FormikHelpers, Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

import { edgePadding, Header } from '../components/snippets';
import Loading from '../components/loading';
import { BingoCard, SearchResults, Category } from '../types'
import api from '../api/backend';
import ApiRender from '../api/render';

//const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
//const interleave = (arr: any, thing: any) => [].concat(...arr.map((n: any) => [n, thing])).slice(0, -1);

const DEBUG = true;
const debugLog = (props: any) => {
    DEBUG && console.log(props);
}

const tileFields = 
    Array(25)
        .fill(null)
        .map((_, index) => `tile_${index + 1}`);
        
const formFields = [...tileFields, 'name', 'category'];

const stringField = (max: number) =>
    Yup.string()
        .default('')
        .required('Cannot be blank.')
        .max(max, `Cannot be longer than ${max} characters.`);

const categorySchema =
    stringField(20)
        .matches(
            /^\w+$/,
            {
                message: 'Can only contain letters, numbers and underscores.',
                excludeEmptyString: true
            }
        );

const cardSchemaShape = Object.fromEntries(
    ([] as any[]).concat(
        tileFields.map(field => [field, stringField(200)]),
        Object.entries({
            name: stringField(50),
            category: categorySchema,
        })
));

const cardSchema = Yup.object().shape(cardSchemaShape);

interface FormRowProps {
    name: string;
    label: string;
    small?: boolean;
    hidden?: boolean;
}

const FormRowIndicator = ({ name, label }: FormRowProps) => (
    <Field name={name}>
        {({ meta }: FieldProps) => (
            !meta.touched
                ? <div className="rounded text-center py-2 sdark-fg">{label}</div>
                : <div className={`rounded text-center py-2 text-white bg-sdark-${meta.error ? 'red' : 'green'}`}>{label}</div>
        )}
    </Field>
);

const DropdownContainer = forwardRef(({ children }: any, ref: any) => (
    <div ref={ref}>
        {children}
    </div>
));

interface FormHelperProps {
    setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => void;
    values: { [x: string]: any; };
}

const FormHelperContext = createContext<FormHelperProps>({ setFieldValue: () => {}, values: {} });

const CategorySearchBar = ({ card }: { card?: BingoCard }) => {
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
        | { type: 'query',      payload: string }
        | { type: 'dropdown',   payload: boolean }
        | { type: 'menuSelect', payload: { query: string; errors: Array<string> } }
        | { type: 'category',   payload: SearchResults<Category> }
        | { type: 'load',       payload: boolean };

    type State = {
        query: string;
        errors: Array<string>;
        showDropdown: boolean;
        loading: boolean;
        disabled: boolean;
        categories: SearchResults<Category>;
    };

    // has to be defined before the reducer in order to work for some reason
    const checkIfInputStopped = () => {
        // hack that checks if input has stopped for at least 500 ms
        setTimeout(() => {
            debugLog({ CATEGORYSEARCHBAR: 'input check', query, queryRef });
            if (query && (query === queryRef.current)) {
                debugLog('searching for categories...');
                getCategories();
            } 
        }, 500);
    }

    const stateReducer = (state: State, action: Action): State => {
        debugLog({ CATEGORYSEARCHBAR: 'reducer', state, action });
        switch (action.type) {
            case 'query':
                checkIfInputStopped();
                return {
                    ...state,
                    query: action.payload,
                    showDropdown: false,
                    disabled: state.disabled ? action.payload.length > 0 : false,
                    errors: action.payload.length > 0 ? state.errors : [],
                };
            case 'dropdown':
                return {
                    ...state,
                    showDropdown: action.payload,
                };
            case 'category':
                return {
                    ...state,
                    showDropdown: true,
                    loading: false,
                    categories: action.payload,
                };
            case 'menuSelect':
                let categoryValue = action.payload.errors.length > 0 ? '' : action.payload.query;
                setFieldValue('category', categoryValue);
                return {
                    ...state,
                    disabled: Boolean(action.payload.query.length > 0),
                    query: action.payload.query,
                    errors: action.payload.errors,
                };
            case 'load':
                return {
                    ...state,
                    showDropdown: !action.payload,
                    loading: action.payload,
                };
        }
    };

    const { setFieldValue, values } = useContext(FormHelperContext);
    const categoryName: string = values.category;
    const initState: State = {
        query: categoryName,
        showDropdown: false,
        loading: false,
        disabled: Boolean(categoryName.length > 0),
        errors: [],
        categories: { count: 0, page_size: 0, results: [] },
    };

    const [{ disabled, errors, query, showDropdown, loading, categories }, dispatch] = useReducer(stateReducer, initState);
    const valid =  errors.length === 0;
    const showQueryButton = disabled && valid;
    const queryRef = useRef(query);
    queryRef.current = query;

    debugLog({ CATEGORYSEARCHBAR: 'states', query, disabled, errors, categoryName });
    
    const getCategories = async () => {
        dispatch({ type: 'load', payload: true });
        let { data, ok } = await api.getTopThreeCategories(query);
        if (ok && data) {
            debugLog(data);
            dispatch({ type: 'category', payload: data });
        } else {
            dispatch({ type: 'load', payload: false });
        }
    }

    const handleSelect = (eventKey: string | null) => {
        let errs: Array<string> = [];

        switch (eventKey) {
            case null:
                break;
            case 'QUERY!':
                try {
                    categorySchema.validateSync(query);
                } catch (err) {
                    errs = err.errors;
                }
                dispatch({ type: 'menuSelect', payload: { query, errors: errs } });
                break;
            default:
                dispatch({ type: 'menuSelect', payload: { query: eventKey, errors: errs } });
        }
    }

    // ============================================================================
    // ========================= 2. Sub-Elements ==================================
    // ============================================================================
    
    const LoadingIndicator = () => <>{
        loading &&
            <div className="input-group-append">
                <span className="input-group-text">
                    <div className="pl-2">
                        <div className="spinner-border spinner-border-sm" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                </span>
            </div>
    }</>;

    const ClearButton = () => <>{
        !showQueryButton && query.length > 0 &&
            <div
                className="input-group-append"
                style={{ cursor: 'pointer' }}
                onClick={() => dispatch({ type: 'query', payload: '' })}
            >
                <span className="input-group-text clear">
                    <FontAwesomeIcon icon={faTimes}/>
                </span>
            </div>
    }</>;

    const QueryButton = () => <>{
        showQueryButton &&
            <div className="input-group-append">
                <span className="input-group-text clear p-1">
                    <div className="p-2 rounded text-white bg-sdark-violet align-items-center justify-content-center">
                        <Row>
                            <Col className={card ? '' : 'pr-2'}>
                                {query}
                            </Col>
                            {
                                !card &&
                                    <Col className='pl-2'>
                                        <div
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => dispatch({ type: 'menuSelect', payload: { query: '', errors: [] } })}
                                        >
                                            <small>
                                                <FontAwesomeIcon icon={faTimes}/>
                                            </small>
                                        </div>
                                    </Col>
                            }
                        </Row>
                    </div>
                </span>
            </div>
    }</>;
    
    const DropdownItems = () => (
        <>
            <Dropdown.Item className='slight-bg' disabled>
                Select one
            </Dropdown.Item>
            <Dropdown.Divider className='border-slight-top'/>
            {
                categories.count > 0
                    ?
                        categories.results.map(category => (
                            <Dropdown.Item className='slight-bg' eventKey={category.name}>
                                {category.name}
                            </Dropdown.Item>
                        ))

                    :  
                        <Dropdown.Item className='slight-bg' eventKey='QUERY!'>
                            Create new category: {query}
                        </Dropdown.Item>
            }
        </>
    );
    
    const CategoryErrors = () => <>{
         errors.length > 0 && query.length > 0 &&
            errors.map(err => (
                <div className="text-sdark-red"><
                    small>{err}</small>
                </div>
            ))
    }</>;

    const SuccessIndicator = () =>
        <div className="input-group-prepend">
            <span
                className={`input-group-text ${disabled ? (valid  ? 'success' : 'error') : ''}`}
            >
                Category
            </span>
        </div>;
    
    // ============================================================================
    // ========================= 3. Main Element ==================================
    // ============================================================================
    
    return (
        <Dropdown
            show={showDropdown}
            onToggle={() => dispatch({ type: 'dropdown', payload: !showDropdown })}
            onSelect={handleSelect}
        >
            <div className="input-group slight-bg rounded">
                <SuccessIndicator/>
                <QueryButton/>
                <input
                    disabled={showQueryButton}
                    type="text"
                    className="form-control"
                    placeholder={showQueryButton ? '' : 'Search'}
                    value={showQueryButton ? '' : query}
                    onChange={e => dispatch({ type: 'query', payload: e.target.value })}
                />
                <ClearButton/>
                <LoadingIndicator/>
            </div>

            <div>
                <CategoryErrors/>
            </div>

            <Dropdown.Toggle as={DropdownContainer} id='create-category'/>
            <Dropdown.Menu className='w-100 slight-bg mt-1 px-2'>
                <DropdownItems/>
            </Dropdown.Menu>
        </Dropdown>

    );
};

const FormRow = ({ name, label }: FormRowProps) => 
    <Field name={name}>
        {({ field, meta }: FieldProps) => (
            <>
                <div className="input-group">
                    <div className="input-group-prepend">
                        <span className={`input-group-text ${meta.touched ? (meta.error ? 'error' : 'success') : ''}`}>
                            {label}
                        </span>
                    </div>
                    <input type='text' className='form-control' placeholder='Empty' {...field}/>
                </div>
                {
                    meta.touched && meta.error && 
                        <div className="text-sdark-red">
                            <small>{meta.error}</small>
                        </div>
                }
            </>
        )}
    </Field>;
    
const preventEnter = (keyEvent: React.KeyboardEvent<HTMLFormElement>) => {
    if (keyEvent.key === 'Enter') {
        keyEvent.preventDefault();
    }
}
    
const CardForm = ({ isSubmitting, card }: { isSubmitting: boolean, card?: BingoCard }) =>
    <Form onKeyDown={preventEnter}>
        <Header card>
            <h2>{card ? `Editing "${card.name}"` : 'Create New Card'}</h2>
        </Header>
        <Row>

            <Col xs={12} lg={5}>
                <div className="p-2">
                    <Col className='pb-2 px-0'>
                        <Row className="pb-2 px-0">
                            <FormRow name='name' label='Name'/>
                        </Row>
                        <Row>
                            <Col className="w-100 px-0">
                                <CategorySearchBar card={card}/>
                            </Col>
                        </Row>
                    </Col>
                    <Row className="row-cols-5 pt-2">
                        {tileFields.map((field, index) => (
                            <div className={edgePadding[index]}>
                                <FormRowIndicator name={field} label={`${index + 1}`}/>
                            </div>
                        ))}
                    </Row>
                </div>
            </Col>

            <Col xs={12} lg={7} className='p-0'>
                <div className="p-2">
                    {tileFields.map((field, index) => (
                        <div className={index !== 24 ? 'pb-2' : ''}>
                            <FormRow name={field} label={`Tile ${index + 1}`}/>
                        </div>
                    ))}
                </div>
            </Col>

            <Col xs={12}>
            </Col>
        </Row>
        <button
            className='btn btn-primary'
            type='submit'
            disabled={isSubmitting}
        >
            Submit
        </button>
    </Form>;

const CardCreateEditLayout = ({ card }: { card?: BingoCard }) => {
    const [{success, cardName}, setState] = useState<{success?: boolean, cardName?: string}>({});
    const history = useHistory();
 
    type ObjectArray<T = any> = {[s: string]: T};

    const defaultValues = (
        card
            ? 
                {
                    ...Object.fromEntries(
                        formFields.map(field => [ field, (card as ObjectArray)[field] ])
                    ),
                    category: card.category.name,
                }

            : cardSchema.getDefault()
    );
    
    const submitCard = async (values: any, { setErrors, resetForm }: FormikHelpers<any>) => {
        let formValues = { ...values, category: {name: values.category} };
        let apiCall = (v: any) => api.createCard(v);

        if (card) {
            apiCall = (v: any) => api.editCard(card.id, v);

            // only sends changed fields in json
            // can't change category in edit mode
            formValues =
                Object.fromEntries(
                    Object.entries(formValues)
                          .filter(([key, value]) =>
                                  key !== 'category' &&
                                  value !== (defaultValues as ObjectArray)[key]));
        }
        
        let { data, ok } = await apiCall(formValues);

        if (!ok && data) {
            setErrors(
                Object.fromEntries(
                    Object.entries(data as ObjectArray<string[]>)
                          .map(([ field, err ]) => [field, err[0]])));
        } else if (ok && !card) {
            resetForm();
        } 

        debugLog({ CARDCREATE: 'submitted card', data, ok });
        setState({ success: ok, cardName: formValues.name });
        return;
    };

    debugLog({ CARDCREATE: 'layout render' });

    const formVerb = card ? 'edit' : 'creat';
    const formVerbCap = formVerb.charAt(0).toUpperCase() + formVerb.slice(1);

    return (
        success
            ?
                <Header card>
                    <h2 className='mb-4'>
                        Successfully {formVerb}ed bingo card!
                    </h2>
                    <button
                        className="btn btn-primary"
                        onClick={() => history.go(-1)}
                    >
                        Go Back
                    </button>
                </Header>
            :
                <div className="px-2">
                    <Formik
                        validationSchema={cardSchema}
                        initialValues={defaultValues}
                        onSubmit={submitCard}
                    >
                        {({ isSubmitting, setFieldValue, values }) => 
                            <FormHelperContext.Provider value={{ setFieldValue, values }}>
                                {isSubmitting
                                    ? <Loading message={`${formVerbCap}ing new bingo card...`}/>
                                    : <CardForm {...{isSubmitting, card}}/>}
                            </FormHelperContext.Provider>}
                    </Formik>
                </div>
    );
};

const CardCreateView = () => {
    const { cardId }: { cardId?: string } = useParams();

    return (
        cardId
            ?
                <ApiRender
                    apiCall={() => api.getCard(`${cardId}`)}
                    component={({ data }) => <CardCreateEditLayout card={data}/>}
                />
            :
                <CardCreateEditLayout/>
    );
}

export default CardCreateView;
