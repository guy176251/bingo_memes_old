import { useState } from 'react';

import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';

import { Link } from 'react-router-dom';

import Loading from '../components/loading';
import { User, UserState } from '../types';
import api from '../api/backend';
import { Header } from '../components/snippets';

interface LoginProps {
    login: (u: User) => void;
    logout: () => void;
    user: UserState;
}

const stringField = () =>
    Yup.string()
        .default('')
        .required('Required');

const LoginSchema = Yup.object().shape({
    username: stringField(),
    password: stringField(),
});

interface LoginState {
    done: boolean;
    ok: boolean;
    valid: boolean;
}

const LoginForm = ({ login, logout, user }: LoginProps) => {
    const [{ done, valid, ok }, setLoginState] = useState<LoginState>({ valid: false, done: false, ok: true });

    const apiLogin = async (credentials: object) => {
        setLoginState({ done: false, valid, ok });

        let resp = await api.login(credentials);
        let thing = false;

        if (resp.data) {
            thing = resp.data.valid;
            if (resp.data.user)
                login(resp.data.user);
        }

        setLoginState({ done: true, valid: thing, ok: resp.ok });
    };

    const apiLogout = async (setSubmitting: (b: boolean) => void) => {
        setSubmitting(true);
        let resp = await api.logout();
        if (resp.ok)
            logout();
        setSubmitting(false);
    };

    const handleSubmit = async (values: any, { resetForm }: FormikHelpers<any>) => {
        await apiLogin(values);
        resetForm();
        return;
    }
   
    const FormView = () =>                
        <>
            <div className="text-center">
                <h1>Login</h1>
                {
                    done && !ok && valid === false &&
                        <div className="text-danger mt-4">Invalid credentials</div>
                }
            </div>
            <div className="mt-4">
                <Form>
                    <div className='form-row'>
                        <div className='form-group col'>
                            <div className="row">
                                <div className="col">
                                    <label>Username</label>
                                </div>
                                <div className="col w-100 text-right">
                                    <ErrorMessage name='username' component='label' className='text-danger'/>
                                </div>
                            </div>
                            <Field name='username' className='form-control'/>
                        </div>
                    </div>
                    <div className='form-row'>
                        <div className='form-group col'>
                            <div className="row">
                                <div className="col">
                                    <label>Password</label>
                                </div>
                                <div className="col w-100 text-right">
                                    <ErrorMessage name='password' component='label' className='text-danger'/>
                                </div>
                            </div>
                            <Field name='password' type='password' className='form-control'/>
                        </div>
                    </div>
                    <button className='btn btn-primary' type='submit'>Login</button>
                    <Link to='/signup/'>
                        <button className='btn btn-warning ml-2'>Signup</button>
                    </Link>
                </Form>
            </div>
        </>;
    
    return (
        <Formik
            validationSchema={LoginSchema}
            initialValues={LoginSchema.default('')}
            onSubmit={handleSubmit}
        >
            {({ isSubmitting, setSubmitting }) => (
                isSubmitting
                    ? <Loading message={'Logging ' + (user ? 'out' : 'in') + '...'}/>
                    : (
                        user
                            ?
                                <Header card>
                                    <div className="text-center">
                                        <h1>Logged in as {user.name}!</h1>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => apiLogout(setSubmitting)}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </Header>
                            :
                                <FormView/>
                    )
            )}
        </Formik>
    );
}

const LoginView = ({ user, login, logout }: LoginProps) =>
    <div className="py-4">
        <div className="row">
            <div className="col-3 d-none d-lg-block"></div>
            <div className="col-12 col-lg-6">
                <LoginForm login={login} logout={logout} user={user}/>
            </div>
            <div className="col-3 d-none d-lg-block"></div>
        </div>
    </div>;

export default LoginView;

/*
    //onClick={() => {
    //    setFieldValue('username', 'placeholder bc validation');
    //    setFieldValue('password', 'placeholder bc validation');
    //}}
    
    const AlreadyLoggedin = () => <>{
        user && 
            <div className="text-center">
                <h1>Logged in as {user.name}!</h1>
                <button
                    className="btn btn-primary"
                    type='submit'
                    onClick={apiLogout}
                >
                    Logout
                </button>
            </div>
    }</>;

 */
