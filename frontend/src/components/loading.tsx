import Spinner from 'react-bootstrap/Spinner';
import React from 'react';

interface LoadingProps {
  message: string | React.ReactElement;
}

const Loading = ({ message }: LoadingProps) => (
  <div className='text-center'>
    <Spinner animation="border" role="status">
      <span className="sr-only">Loading...</span>
    </Spinner>
    <div className="mt-2">
      {
        typeof message === 'string'
          ? <h4>{message}</h4>
          : message
      }
    </div>
  </div>
);

export default Loading;
