"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const api = require("../api");
const Event_1 = require("../Event");
const get = (req, res) => {
    api.responseJSON(res, Event_1.default.log);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["events"],
    operationId: "getEvents",
    responses: {
        200: {
            description: "OK",
            schema: {
                type: "array",
                items: {
                    $ref: "#/definitions/Event"
                }
            }
        },
        default: {
            description: "Unexpected Error",
            schema: {
                $ref: "#/definitions/Error"
            }
        }
    }
};
//# sourceMappingURL=events.js.map