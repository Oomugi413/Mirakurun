import { Operation } from "express-openapi";
export declare const parameters: ({
    in: string;
    name: string;
    type: string;
    enum: string[];
    required: boolean;
} | {
    in: string;
    name: string;
    type: string;
    required: boolean;
    enum?: undefined;
})[];
export declare const get: Operation;
