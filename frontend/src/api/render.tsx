import { useEffect, useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';

import { ApiResponse } from './backend';
import debugLog from '../debug';

interface ComponentProps {
    data: any;
}

interface ApiRenderProps {
    apiCall: () => Promise<ApiResponse>;
    component: React.FunctionComponent<ComponentProps>;
    loadingMessage?: string;
    key: string;
}


const ApiRender = ({ apiCall, loadingMessage, component }: ApiRenderProps) => {
    const [{ data, ok }, setResp] = useState<ApiResponse>({ data: null, ok: true });

    useEffect(() => {
        (async () => {
            debugLog({ APIRENDER: 'getting data', data, ok });
            let respData = await apiCall();
            setResp(respData);
        })();
    }, []);

    const RespStatus = () => (
         (data?.detail || !ok)
            ?   <div className='text-sdark-red text-center my-4'>
                    <h3>{`Error` + (data?.detail ? `: ${data.detail}` : '')}</h3>
                </div>

            :   <div className='text-center mt-4'>
                    <Spinner animation="border" role="status">
                        <span className="sr-only">Loading...</span>
                    </Spinner>
                    {
                        loadingMessage &&
                            <div className="mt-2">
                                {loadingMessage}
                            </div>
                    }
                </div>
    );
    
    let Component = component;

    const PageContent = () => (
        data && (!data.detail && ok)
            ? <Component data={data}/>
            : <RespStatus/>
    );
 
    return  <PageContent/>;
}

export default ApiRender;
