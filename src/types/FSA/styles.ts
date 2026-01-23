import { makeStyles } from '@styles';

/* -------------------- styles -------------------- */

export const useLocalStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    height: 600,
    display: 'flex',
    border: '1px solid #ddd',
    fontFamily: 'sans-serif',
  },
  panel: {
    width: 280,
    borderRight: '1px solid #ddd',
    padding: theme.spacing(2),
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    // maxHeight: '80vh',       // <-- cap max height
    overflowY: 'auto',       // <-- enable scrolling
  },
  panelTitle: {
    fontWeight: 600,
    fontSize: 16,
    borderBottom: '1px solid #eee',
    paddingBottom: theme.spacing(1),
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  inputField: {
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    cursor: 'pointer',
    padding: '4px 0',
  },
  deleteButton: {
    marginTop: theme.spacing(2),
    padding: '8px',
    backgroundColor: '#fff1f0',
    color: '#cf1322',
    border: '1px solid #ffa39e',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 600,
    '&:hover': {
      backgroundColor: '#ffa39e',
      color: '#fff',
    },
  },
  flowWrapper: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  },
  toolbar: {
    padding: theme.spacing(1),
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  addButton: {
    padding: '4px 12px',
    cursor: 'pointer',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  node: {
    border: '1px solid #777',
    borderRadius: '50%',
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  initialNode: {
    backgroundColor: '#e6fffa',
    borderWidth: 2,
    borderColor: '#38b2ac',
  },
  acceptNode: {
    boxShadow: '0 0 0 4px #fff, 0 0 0 6px #333',
  },
  teacherPanel: {
    position: 'absolute',
    top: theme.spacing(1.5),
    right: theme.spacing(1.5),
    width: 300,
    maxHeight: '80%',            // 👈 cap height
    overflowY: 'auto',           // 👈 scroll when needed
    backgroundColor: '#fafafa',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: theme.spacing(2),
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  teacherPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
  },

  chevron: {
    fontSize: 14,
    opacity: 0.7,
  },

  errorNode: {
    borderColor: '#cf1322',
    borderWidth: 3,
    backgroundColor: '#fff1f0',
  },

  warningNode: {
    borderColor: '#faad14',
    borderWidth: 3,
    backgroundColor: '#fffbe6',
  },
}));