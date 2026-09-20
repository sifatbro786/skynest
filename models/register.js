import mongoose from "mongoose";

/**
 * Compile a Mongoose model, recompiling it in development.
 *
 * The usual `models.X || model("X", schema)` guard exists because Next
 * re-evaluates server modules constantly and Mongoose throws
 * `OverwriteModelError` on a second `model()` call with the same name. But
 * `mongoose.models` lives on the mongoose singleton, which survives HMR — so
 * that guard also means **an edited schema is never picked up until the dev
 * server restarts**.
 *
 * That failure is silent and expensive. Mongoose is strict by default, so a
 * field the cached schema has never heard of is dropped on `save()` with no
 * error: the form posts it, the route assigns it, the response looks fine,
 * and the value is simply not there on reload. Adding `isHero` cost exactly
 * one round of that.
 *
 * So in development the old model is deleted first and the schema recompiled
 * from the file that just changed. `ref` strings resolve at populate time, so
 * re-registering one model does not invalidate the others — `models/index.js`
 * still imports every schema before any query runs.
 *
 * In production the module graph is evaluated once and there is nothing to
 * recompile, so this is the plain cached lookup.
 */
export function registerModel(name, schema) {
    if (process.env.NODE_ENV !== "production" && mongoose.models[name]) {
        mongoose.deleteModel(name);
    }
    return mongoose.models[name] || mongoose.model(name, schema);
}

export default registerModel;
