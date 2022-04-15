import { useState, useEffect, useContext } from 'react';

import style from './App.module.css';

import { useSecureRPC } from './rpc';
import { FilteredTreeView } from './componets/FilteredTreeView';
import Login from './componets/Login'
import { useAuth, AuthContext } from './auth';

interface INote {
  id: number;
  name: string;
  user: string;
  dirty?: boolean;
  content: string;
}

function App() {
  const { auth, setAuth } = useAuth();
  const [ notes, setNotes ] = useState<INote[]>([]);
  const [ note, setNote ] = useState<INote | null>(null);
  const [ init, setInit ] = useState<boolean>(true);
  const {
    error,
    call: get_notes,
    result: initNotes,
    authError,
    isLoading
  } = useSecureRPC<INote[]>('get_notes');

  const updateNote = (value: string) => {
    const id = note?.id;
    const index = notes.findIndex(note => note.id == id);
    notes[index].content = value;
    notes[index].dirty = true;
    setNotes([...notes]);
  };

  useEffect(() => {
    if (auth) {
      get_notes(auth.username);
    }
  }, [auth]);

  useEffect(() => {
    if (notes.length && init) {
      setNote(notes[0]);
      setInit(false);
    }
  }, [notes]);

  useEffect(() => {
    if (initNotes) {
      setNotes(initNotes);
    }
  }, [initNotes]);

  if(!auth) {
    return <Login setAuth={setAuth} />
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (error || !initNotes) {
    return <p>error</p>;
  }
  if (authError) {
    return <p>Error: {authError}</p>;
  }

  // TODO: fix type of INote vs TreeNodeT
  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      <div className={ style.app }>
        <header>
          <p>Welcome { auth.username }</p>
          <h1>This is { note?.name }</h1>
          <Test/>
        </header>
        <textarea value={note?.content } onChange={(e) => { updateNote(e.target.value) }} />
        <FilteredTreeView className={style.sidebar}
                          data={notes}
                          filter={(re, note) => !!note.name.match(re)}
                          onChange={note => { setNote(note) }}/>
        <footer className={style.footer}>
          <p>
            Copyright (C) 2022 <a href="https://jakub.jankiewicz.org">Jakub T. Jankiewicz</a>
          </p>
        </footer>
      </div>
    </AuthContext.Provider>
  );
}

function Test() {
  const { auth } = useContext(AuthContext);
  if (auth?.token) {
    return <p>Token: <strong>{ auth.token }</strong></p>;
  }
  return <p>Pending...</p>
}

export default App;
