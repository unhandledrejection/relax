import produce from 'immer'
import { useState, useEffect } from './react'

import {
  ConsumerProps,
  Updater,
  Opt,
  Reducers,
  Effects,
  Selector,
  reducerFn,
  ActionSelector,
} from './typings'
export { createStore, ConsumerProps }

function createStore<S, R extends Reducers<S>, E extends Effects>(opt: Opt<S, R, E>) {
  let state: any = opt.state
  const updaters: Array<Updater<S>> = []

  function putFactory(payload: any) {
    return function put(actionName: string) {
      if (!updaters.length) return
      updaters.forEach((updater, i) => {
        updater(opt.reducers[actionName], payload)
      })
    }
  }

  function useStore() {
    const [storeState, setState] = useState(state)

    useMount(() => {
      updaters.push(update)
    })

    function update(action: reducerFn<S>, payload: any): any {
      console.log('update...')

      if (!action) return null

      setState((prevState: any) => {
        const nextState: S = produce<any>(prevState, (draft: S) => {
          action(draft, payload)
        })

        state = nextState
        return nextState
      })
    }

    function get<P>(selector: Selector<S, P>) {
      return selector(storeState)
    }

    function dispatch(action: keyof (R & E) | ActionSelector<R, E>, payload?: any) {
      const actionName = getActoinName(action)
      console.log('actionName:', actionName)
      if (opt.effects[actionName]) {
        opt.effects[actionName](putFactory(payload))
        return
      }
      if (!updaters.length) return

      updaters.forEach(updater => {
        updater(opt.reducers[actionName], payload)
      })
    }

    return { get, dispatch }
  }

  return {
    useStore,
  }
}

function useMount(mount: any): void {
  useEffect(mount, [])
}

function getActoinName(action: any): string {
  if (typeof action === 'string') return action

  try {
    const str = action.toString()
    const regAction = /return.*\.(.*);/
    const arr: any = str.match(regAction) || []
    return arr[1]
  } catch {
    throw new Error('action type or selector invalid')
  }
}