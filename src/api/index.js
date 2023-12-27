import request from '@/utils/request';

export const getData = (data) => request.post('/getData', data);

export const addData = (data) => request.post('/addData', data);
