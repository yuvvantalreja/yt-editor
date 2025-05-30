import {createAction, createSelector, createSlice} from '@reduxjs/toolkit';
import {Runtime} from 'vega-typings/types/index.js';
import {toCytoscape} from './utils/toCytoscape.js';
import {createSliceSelector} from './utils/createSliceSelector.js';
import {runtimeToGraph} from './utils/runtimeToGraph.js';

export type RuntimeState = Runtime | null;
const initialState: RuntimeState = null;

export const setRuntime = createAction<Runtime>('setRuntime');

export const runtimeSlice = createSlice({
  name: 'runtime',
  initialState,
  reducers: {},
  extraReducers: (builder) => builder.addCase(setRuntime, (_state, {payload}) => payload),
});

export const runtimeSelector = createSliceSelector(runtimeSlice);
export const graphSelector = createSelector(runtimeSelector, (runtime) =>
  runtime === null ? null : runtimeToGraph(runtime),
);

export const cytoscapeElementsSelector = createSelector(graphSelector, (graph) =>
  graph === null ? null : toCytoscape(graph),
);
