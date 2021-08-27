import { useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";

import * as Yup from "yup";
import { Formik, Form as FormikForm, Field, ErrorMessage, FormikHelpers } from "formik";

import { Link } from "react-router-dom";

import Loading from "../components/loading";
import { Header } from "../components/snippets";
import { useAuth } from "../auth";

const stringField = () => Yup.string().default("").required("Required");

const LoginSchema = Yup.object().shape({
    username: stringField(),
    password: stringField(),
});

interface LoginState {
    done: boolean;
    ok: boolean;
    valid: boolean;
}

const LoginForm = () => {
    const { user, login, logout } = useAuth();

    const [{ done, valid, ok }, setLoginState] = useState<LoginState>({
        valid: false,
        done: false,
        ok: true,
    });

    const handleSubmit = async (values: any, { resetForm }: FormikHelpers<any>) => {
        setLoginState({ done: false, valid, ok });

        login({
            credentials: values,
            callback({ data, ok }) {
                setLoginState({ done: true, valid: data ? data.valid : false, ok });
                resetForm();
            },
        });
    };

    const FormView = () => (
        <>
            <div className="text-center">
                <h1>Login</h1>
                {done && !ok && valid === false && <div className="text-danger mt-4">Invalid credentials</div>}
            </div>
            <div className="mt-4">
                <FormikForm noValidate>
                    <Row>
                        <Col>
                            <Form.Label>Username</Form.Label>
                        </Col>
                        <Col className="w-100 text-end">
                            <ErrorMessage name="username" component="label" className="text-danger" />
                        </Col>
                        <Col xs={12}>
                            <Field name="username" className="form-control" />
                        </Col>
                    </Row>
                    <Row className="mt-2 mb-3">
                        <Col>
                            <Form.Label>Password</Form.Label>
                        </Col>
                        <Col className="w-100 text-end">
                            <ErrorMessage name="password" component="label" className="text-danger" />
                        </Col>
                        <Col xs={12}>
                            <Field name="password" type="password" className="form-control" />
                        </Col>
                    </Row>
                    <button className="btn btn-primary text-white" type="submit">
                        Login
                    </button>
                    <Link to="/signup/">
                        <button className="btn btn-warning text-white ms-2">Signup</button>
                    </Link>
                </FormikForm>
            </div>
        </>
    );

    return (
        <Formik validationSchema={LoginSchema} initialValues={LoginSchema.default("")} onSubmit={handleSubmit}>
            {({ isSubmitting, setSubmitting }) =>
                isSubmitting ? (
                    <Loading message={"Logging " + (user ? "out" : "in") + "..."} />
                ) : user ? (
                    <Header card>
                        <div className="text-center">
                            <h1>Logged in as {user.name}!</h1>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setSubmitting(true);
                                    logout({
                                        callback() {
                                            setSubmitting(false);
                                        },
                                    });
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </Header>
                ) : (
                    <FormView />
                )
            }
        </Formik>
    );
};

const LoginView = () => (
    <div className="py-4">
        <Row>
            <Col xs={3} className="d-none d-lg-block"></Col>
            <Col xs={12} lg={6}>
                <LoginForm />
            </Col>
            <Col xs={3} className="d-none d-lg-block"></Col>
        </Row>
    </div>
);

export default LoginView;
