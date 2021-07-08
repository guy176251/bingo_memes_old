import { useState } from 'react';

import * as Yup from 'yup';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';

import { Link } from 'react-router-dom';

import Loading from '../components/loading';
import { User, UserState } from '../types';
import api from '../api/backend';

interface LoginProps {
    login: (u: User) => void;
    logout: () => void;
    user: UserState;
}

const LoginView = ({ user, login, logout }: LoginProps) => {

    return (
        <div className="py-4">
            <div className="row">
                <div className="col-3 d-none d-lg-block"></div>
                <div className="col-12 col-lg-6">
                    <LoginForm login={login} logout={logout} user={user}/>
                </div>
                <div className="col-3 d-none d-lg-block"></div>
            </div>
        </div>
    );
}

export default LoginView;

const LoginSchema = Yup.object().shape({
    username: Yup.string().required('Required'),
    password: Yup.string().required('Required'),
});

const LoginForm = ({ login, logout, user }: LoginProps) => {
    const [statusCode, setStatusCode] = useState(200);

    const apiLogin = async (credentials: object) => {
        let resp = await api.login(credentials);
        if (resp.data && resp.data.user)
            login(resp.data.user);
    };

    const apiLogout = async () => {
        let resp = await api.logout();
        if (resp.ok)
            logout();
    };

    const handleSubmit = async (values: any, { resetForm }: FormikHelpers<any>) => {
        if (user) await apiLogout();
        else await apiLogin(values);

        resetForm();
        return;
    }
   
    return (
        <Formik
            validationSchema={LoginSchema}
            initialValues={LoginSchema.default('')}
            onSubmit={handleSubmit}
        >
            {({ isSubmitting, setFieldValue }) => (
                isSubmitting
                    ? <Loading message={'Logging ' + (user ? 'out' : 'in') + '...'}/>
                    : (
                            user
                                ? <div className="text-center">
                                        <h1>Logged in as {user.name}!</h1>
                                        <Form>
                                            <button
                                                className="btn btn-primary"
                                                disabled={isSubmitting}
                                                type='submit'
                                                onClick={() => {
                                                    setFieldValue('username', 'placeholder bc validation');
                                                    setFieldValue('password', 'placeholder bc validation');
                                                }}
                                            >
                                                Logout
                                            </button>
                                        </Form>
                                    </div>

                                : <>
                                        <div className="text-center">
                                            <h1>Login</h1>
                                            {
                                                statusCode === 400
                                                    &&    <div className="text-danger mt-4">Invalid credentials</div>
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
                                                <button className='btn btn-primary' type='submit' disabled={isSubmitting}>Login</button>
                                                <Link to='/signup/'>
                                                    <button className='btn btn-warning ml-2'>Signup</button>
                                                </Link>
                                            </Form>
                                        </div>
                                    </>
                        )
            )}
        </Formik>
    );
}
