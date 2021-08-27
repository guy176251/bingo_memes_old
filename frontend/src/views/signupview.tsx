import { useState } from "react";
import { FormikHelpers, Formik, Form as FormikForm, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";

import Loading from "../components/loading";
import api from "../api/backend";

const SignupView = () => (
    <div className="py-4">
        <div className="row">
            <div className="col-3 d-none d-lg-block"></div>
            <div className="col-12 col-lg-6">
                <SignupForm />
            </div>
            <div className="col-3 d-none d-lg-block"></div>
        </div>
    </div>
);

export default SignupView;

const stringField = () => Yup.string().default("").required("Required");
const SignupSchema = Yup.object().shape({
    username: stringField().min(2, "Too Short!").max(50, "Too Long!"),
    password: stringField().min(10, "Too Short!"),
    confirmPassword: stringField().when("password", {
        is: (val: string) => (val && val.length > 0 ? true : false),
        then: Yup.string().oneOf([Yup.ref("password")], "Needs to match password"),
    }),
    email: stringField().email("Invalid email"),
});

const signupFields: Array<[string, string, string]> = [
    // label               , name             , type
    ["Username", "username", "text"],
    ["Email", "email", "email"],
    ["Password", "password", "password"],
    ["Confirm Password", "confirmPassword", "password"],
];

type APIResult = string[];
interface APIError {
    email?: APIResult;
    password?: APIResult;
    username?: APIResult;
}

const SignupForm = () => {
    const [createdSuccess, setCreatedSuccess] = useState(false);
    const [submitDone, setDone] = useState(false);

    const submitUser = async (values: any, { resetForm, setErrors }: FormikHelpers<any>) => {
        setDone(false);
        let { data, ok } = await api.createUser({
            username: values.username,
            password: values.password,
            email: values.email,
        });

        if (data && !ok) {
            //
            // backend validator sends errors in arrays
            // since formik error message can only show one string, I'm opting to only show the first error string
            // prob have to add a way to view multiple errors at some point
            //
            setErrors(Object.fromEntries(Object.entries(data as APIError).map(([field, err]) => [field, err[0]])));
        } else if (ok) {
            resetForm();
            setCreatedSuccess(true);
        }
        setDone(true);
        return;
    };

    const SignupFormLayout = ({ isSubmitting }: { isSubmitting: boolean }) => (
        <>
            <div className="text-center">
                <h1>Signup</h1>
            </div>
            {!createdSuccess && submitDone && (
                <div className="text-danger text-center py-2">
                    <p>There was something wrong.</p>
                </div>
            )}
            <FormikForm>
                <div className="mt-4 mb-3">
                    {signupFields.map(([fieldLabel, fieldName, fieldType]) => (
                        <Row className="mb-2">
                            <Col>
                                <Form.Label>{fieldLabel}</Form.Label>
                            </Col>
                            <Col className="w-100 text-end">
                                <ErrorMessage name={fieldName} component="label" className="text-danger" />
                            </Col>
                            <Col xs={12}>
                                <Field name={fieldName} type={fieldType} className="form-control" />
                            </Col>
                        </Row>
                    ))}
                </div>
                <button className="btn btn-primary text-white" type="submit" disabled={isSubmitting}>
                    Signup
                </button>
                <Link to="/login/">
                    <button className="btn btn-warning text-white ms-2">Back to Login</button>
                </Link>
            </FormikForm>
        </>
    );

    const SignupSuccess = () => (
        <div className="text-center">
            <div className="mb-2">
                <h1>Account creation successful!</h1>
            </div>
            <Link to="/login/">
                <button className="btn btn-warning ms-2">Back to Login</button>
            </Link>
        </div>
    );

    return (
        <Formik
            validateOnBlur={true}
            validateOnChange={false}
            validationSchema={SignupSchema}
            initialValues={SignupSchema.getDefault()}
            onSubmit={submitUser}
        >
            {({ isSubmitting }) =>
                isSubmitting ? (
                    <Loading message="Creating new account..." />
                ) : createdSuccess ? (
                    <SignupSuccess />
                ) : (
                    <SignupFormLayout {...{ isSubmitting }} />
                )
            }
        </Formik>
    );
};
