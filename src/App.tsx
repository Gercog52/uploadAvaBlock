import React, {useReducer} from 'react';
import AvaBlock from './components/avaBlock';
import {uploadAvaRequest, resultCodeInfo} from './api/api';
import {uploadAvaRequestCancel} from './api/api';
import './App.css';
import * as axios from 'axios';

export type ActionsOfObj<obj> = obj extends { [key: string]: (...arg: any) => infer fullActions } ? fullActions : never;

const initialState = {
  isUploadingAva: false,
  avaUrl: 'https://www.imgonline.com.ua/examples/bee-on-daisy.jpg',
  uploadPrograss: 0,
  textError: undefined as undefined | string
};

const actions = {
  startUpload: () => ({
    type: "START_UPLOAD"
  }) as const,
  stopUpload: () => ({
    type: "STOP_UPLOAD"
  }) as const,
  changeUploadProgress: (value: number) => ({
    type: "CHANGE_PROGRESS",
    value,
  }) as const,
  endUpload: (avaUrl: string) => ({
    type: "END_UPLOAD",
    avaUrl
  }) as const,
  setErrorRequest: (textError: string) => ({
    type: "SET_ERROR",
    textError
  }) as const,
  resetRequestError: () => ({
    type: "RESET_ERROR"
  }) as const,
}

function reducer(state: typeof initialState, action: ActionsOfObj<typeof actions>): typeof initialState {
  switch (action.type) {
    case "START_UPLOAD": {
      return {
        ...state,
        isUploadingAva: true,
        uploadPrograss: 0,
        textError: '',
      }
    }
    case "CHANGE_PROGRESS": {
      return {
        ...state,
        uploadPrograss: action.value
      }
    }
    case "END_UPLOAD": {
      return {
        ...state,
        avaUrl: action.avaUrl,
        uploadPrograss: 0,
        isUploadingAva: false,
        textError: undefined
      }
    }
    case "SET_ERROR": {
      return {
        ...state,
        textError: action.textError,
        isUploadingAva: false,
        uploadPrograss: 0,
      }
    }
    case "RESET_ERROR": {
      return {
        ...state,
        textError: ''
      }
    }
    case "STOP_UPLOAD": {
      return {
        ...state,
        isUploadingAva: false,
        uploadPrograss: 0,
      }
    }
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const uploadAvaThunk = (ava?: File) => {
    if (ava) {
      const formData = new FormData();
      formData.append('img', ava);
      
      // fix rerenders then error request
      let requestIsEnd = false;
      setTimeout(() => !requestIsEnd && dispatch(actions.startUpload()),100);
      uploadAvaRequest(formData, (v) => dispatch(actions.changeUploadProgress(v)))
        .then(avaLoadInfo => {
          if (avaLoadInfo.resultCode === resultCodeInfo.sicces && avaLoadInfo.data) {
            dispatch(actions.endUpload(process.env.REACT_APP_BACK_URL+avaLoadInfo.data.link));
          } else {
            dispatch(actions.setErrorRequest('Error loading'))
          }
        })
        .catch((error) => {
          if (!axios.default.isCancel(error)) {
            dispatch(actions.setErrorRequest('Error loading'))
          }
        })
        .then(() => {requestIsEnd = true})
    }
  }
  const uploadAvaRequestCancelThunk = () => {
    if(uploadAvaRequestCancel.cancel) {
      uploadAvaRequestCancel.cancel();
      dispatch(actions.stopUpload());
    }
  }
  const resetError = () => dispatch(actions.resetRequestError());

  return (
    <div className="App">
      <AvaBlock uploadAvaThunk={uploadAvaThunk}
                uploadAvaRequestCancelThunk={uploadAvaRequestCancelThunk}
                resetError={resetError}
                avaUrl={state.avaUrl}
                textError={state.textError}
                uploadProgress={state.uploadPrograss}
                isUploadingAva={state.isUploadingAva}
      />
    </div>
  );
}

export default App;
