import * as React from 'react';

// Input components
import { AbstractInputHandle, HTMLAbstractInputElement } from '@client/components/input/peripherals';
import Input from '@client/components/input/input';
import Spinner from '@client/components/spinner';
import URLUtils from '@client/utils/url';

// Events & Toasts
import * as InternalEvents from '@client/events';
import Toast, { ToastProps } from '@client/components/toast';

// Types & Models
import JsonApiException from '@client/models/json-api-exception';
import { LoginForm as LoginFormData } from 'form-types';

// Http webservice client
import AppService from '@client/services/app-service';

// Utilities

export interface LoginFormProps {
    csrfToken: string;
}

export default function LoginForm(props: LoginFormProps): React.JSX.Element {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */
    const [isValid, setIsValid] = React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [linkArrowSvg, setLinkArrowSvg] = React.useState<string>('');
    const [formData, setFormData] = React.useState<LoginFormData>({
        username: '',
        password: ''
    });

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */
    const inputRefs: { [key in keyof LoginFormData]: React.RefObject<AbstractInputHandle | null> } = {
        username: React.useRef<AbstractInputHandle | null>(null),
        password: React.useRef<AbstractInputHandle | null>(null)
    };

    /**
     * ------------------------------------------
     * ----------- EVENT HANDLERS ---------------
     * ------------------------------------------
     */
    const handleChange = (event: InternalEvents.ChangeEvent<HTMLAbstractInputElement>): void => {
        setFormData({
            ...formData,
            [event.currentTarget.name]: event.detail.value
        });
        checkValidity();
    };

    const handleEnter = (): void => {
        if (reportValidity()) {
            submit();
        }
    };

    const handleClickSubmit = (): void => {
        if (reportValidity()) {
            submit();
        }
    };

    /**
     * ------------------------------------------
     * ----------- HELPER METHODS ---------------
     * ------------------------------------------
     */
    const checkValidity = (): boolean => {
        let valid = true;
        Object.values(inputRefs).forEach((ref) => {
            if (!ref.current?.checkValidity()) {
                valid = false;
            }
        });
        setIsValid(valid);
        return valid;
    };

    const reportValidity = (): boolean => {
        let valid = true;
        Object.values(inputRefs).forEach((ref) => {
            if (!ref.current?.reportValidity()) {
                valid = false;
            }
        });
        setIsValid(valid);
        return valid;
    };

    const submit = async () => {
        setIsLoading(true);
        try {
            const service = new AppService();
            service.setCSRFToken(props.csrfToken);
            await service.login(formData);
            Toast.showToast({
                title: 'Success!',
                message: 'You have been successfully logged in.',
                variant: 'success'
            });
        } catch (error) {
            const toastProps: ToastProps = {
                title: 'Error',
                message: 'There was an error submitting your request. Please try again.',
                variant: 'error',
                mode: 'sticky'
            };
            if (error instanceof Error) {
                toastProps.message = error.message;
            }
            if (error instanceof JsonApiException) {
                error.payload.errors?.forEach((error) => {
                    error.fields?.forEach((field) => {
                        inputRefs[field as keyof LoginFormData]?.current?.setCustomValidity(error.detail);
                    });
                });
            }
            Toast.showToast(toastProps);
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * ------------------------------------------
     * --------------- EFFECTS ------------------
     * ------------------------------------------
     */
    React.useEffect(() => {
        URLUtils.getImageContent('link-arrow.svg')
            .then(setLinkArrowSvg)
            .catch((error) => {
                console.error('Error loading link-arrow.svg:', error);
            });
    }, []);

    /**
     * ------------------------------------------
     * ------------- RENDERING ------------------
     * ------------------------------------------
     */
    return (
        <div className='card p-4'>
            <div className='row g-3'>
                {isLoading && <Spinner />}
                <Input
                    ref={inputRefs.username}
                    className='col-md-6'
                    type='text'
                    id='username'
                    name='username'
                    label='Username'
                    value={formData.username}
                    minLength={1}
                    maxLength={80}
                    onChange={handleChange}
                    onEnter={handleEnter}
                    onBlur={checkValidity}
                    required
                />
                <Input
                    ref={inputRefs.password}
                    className='col-md-6'
                    type='text'
                    id='password'
                    name='password'
                    label='Password'
                    value={formData.password}
                    minLength={10}
                    maxLength={80}
                    onChange={handleChange}
                    onEnter={handleEnter}
                    onBlur={checkValidity}
                    required
                />
                <div className='col-12'>
                    <button
                        type='button'
                        className='btn btn-outline-primary px-4'
                        disabled={!isValid}
                        onClick={handleClickSubmit}
                        dangerouslySetInnerHTML={{ __html: `Log In ${linkArrowSvg}` }}
                    ></button>
                </div>
            </div>
        </div>
    );
}
