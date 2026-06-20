import ConnectionBadge from './chat/ConnectionBadge';
import { ConnectionState } from '@/lib/callbacks';

interface NavbarProps {
    connectionState: ConnectionState;
}

const Navbar = ({ connectionState }: NavbarProps) => {
    return (
        <header className="flex items-center justify-between px-6 py-4 shadow-md sticky top-0 z-10">
            <h1 className="text-lg font-bold">Alchemyst-Agent</h1>
            <ConnectionBadge state={connectionState} />
        </header>
    );
};

export default Navbar;
