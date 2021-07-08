import { useState } from 'react';
import { FormikHelpers, Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';

import Loading from '../components/loading';
import api from '../api/backend';

const SignupView = () => (
    <div className="py-4">
        <div className="row">
            <div className="col-3 d-none d-lg-block"></div>
            <div className="col-12 col-lg-6">
                <SignupForm/>
            </div>
            <div className="col-3 d-none d-lg-block"></div>
        </div>
    </div>
);

export default SignupView;

const stringField = () => Yup.string().default('').required('Required');
const SignupSchema = Yup.object().shape({
    username: stringField()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!'),
    password: stringField()
        .min(10, 'Too Short!'),
    confirmPassword: stringField()
        .when('password', {
            is: (val: string) => (val && val.length > 0 ? true : false),
            then: Yup.string().oneOf(
                [Yup.ref('password')],
                'Needs to match password'
            )
        }),
    email: stringField().email('Invalid email'),
});

const signupFields: Array<[string, string, string]> = [
// label               , name             , type
    ['Username'        , 'username'       , 'text'],
    ['Email'           , 'email'          , 'email'],
    ['Password'        , 'password'       , 'password'],
    ['Confirm Password', 'confirmPassword', 'password'],
]

type APIResult = string[];
interface APIError {
    email?: APIResult;
    password?: APIResult;
    username?: APIResult;
}

const SignupForm = () => {
    const [ createdSuccess, setCreatedSuccess ] = useState(false);
    const [ submitDone, setDone ] = useState(false);

    const submitUser = async (values: any, { resetForm, setErrors }: FormikHelpers<any>) => {
        setDone(false);
        let resp = await api.createUser({
            username: values.username,
            password: values.password,
            email: values.email,
        });

        if (resp.data && !resp.ok) {
            // 
            // backend validator sends errors in arrays
            // since formik error message can only show one string, I'm opting to only show the first error string
            // prob have to add a way to view multiple errors at some point
            //
            let apiErr: APIError = resp.data;
            setErrors(Object.fromEntries(Object.entries(apiErr).map(([ field, err ]) => [field, err[0]])));
        } else if (resp.ok) {
            resetForm();
            setCreatedSuccess(true);
        }
        setDone(true);
        return;
    }

    const SignupFormLayout = ({ isSubmitting }: { isSubmitting: boolean }) => (
        <>
            <div className="text-center">
                <h1>Signup</h1>
            </div>
            {
                !createdSuccess && submitDone
                    ?
                        <div className="text-danger text-center">
                            <h1>Whoops!</h1>
                            <p>There was something wrong, please submit again.</p>
                        </div>

                    : null
            }
            <div className="mt-4">
                <Form>
                    {
                        signupFields.map(([ fieldLabel, fieldName, fieldType ]) => (
                            <div className='form-row'>
                                <div className='form-group col'>
                                    <div className="row">
                                        <div className="col">
                                            <label>{fieldLabel}</label>
                                        </div>
                                        <div className="col w-100 text-right">
                                            <ErrorMessage name={fieldName} component='label' className='text-danger'/>
                                        </div>
                                    </div>
                                    <Field name={fieldName} type={fieldType} className='form-control'/>
                                </div>
                            </div>
                        ))
                    }
                    <button className='btn btn-primary' type='submit' disabled={isSubmitting}>Signup</button>
                    <Link to='/login/'>
                        <button className='btn btn-warning ml-2'>Back to Login</button>
                    </Link>
                </Form>
            </div>
        </>
    );
    
    const SignupSuccess = () => (
       <div className="text-center">
           <div className="mb-2">
               <h1>Account creation successful!</h1>
           </div>
           <Link to='/login/'>
               <button className='btn btn-warning ml-2'>Back to Login</button>
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
            {({ isSubmitting }) => (
                isSubmitting
                    ? <Loading message='Creating new account...' />
                    : (createdSuccess
                        ? <SignupSuccess/>
                        : <SignupFormLayout {...{isSubmitting}}/>)
            )}
        </Formik>
    );
}
