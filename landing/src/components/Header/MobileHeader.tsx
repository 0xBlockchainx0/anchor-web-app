import { Menu, MenuClose } from '@anchor-protocol/icons';
import { IconToggleButton } from '@anchor-protocol/neumorphism-ui/components/IconToggleButton';
import { WebAppButton } from 'components/Header/WebAppButton';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

export interface MobileHeaderProps {
  className?: string;
  color: 'dark' | 'light';
}

function MobileHeaderBase({ className, color }: MobileHeaderProps) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <header className={className} data-dark={color === 'dark'} data-open={open}>
      {open && (
        <nav>
          <NavLink to="/market" onClick={() => setOpen(false)}>
            MARKET
          </NavLink>
          <a
            href="https://anchor-protocol.gitbook.io/anchor-1/"
            target="anchor-developers"
            onClick={() => setOpen(false)}
          >
            DEVELOPERS
          </a>
          <NavLink to="/contact" onClick={() => setOpen(false)}>
            CONTACT
          </NavLink>
          <WebAppButton />
        </nav>
      )}
      <section>
        <Link to="/" onClick={() => setOpen(false)}>
          ANCHOR
        </Link>
        <IconToggleButton
          on={open}
          onChange={setOpen}
          onIcon={MenuClose}
          offIcon={Menu}
        />
      </section>
    </header>
  );
}

const slide = keyframes`
  0% {
    transform: translateY(-100%);
    opacity: 0.7;
  }
  
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

export const MobileHeader = styled(MobileHeaderBase)`
  // ---------------------------------------------
  // style
  // ---------------------------------------------
  > section {
    background-color: #ffffff;

    a {
      text-decoration: none;
      color: #333333;
    }

    button {
      color: #333333;
    }
  }

  > nav {
    background-color: #ffffff;

    a {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: -0.2px;
      text-decoration: none;

      color: #696969;

      &:hover {
        color: #515151;
      }

      &.active {
        color: #333333;
      }
    }

    > button {
      color: #999999;
      background-color: #f6f6f6;

      &:hover {
        color: #7e7e7e;
        background-color: #e9e9e9;
      }
    }
  }

  &[data-dark='true'] {
    > section {
      background-color: #000000;

      a {
        color: rgba(255, 255, 255, 0.5);
      }
    }

    nav {
      background-color: #000000;

      a {
        color: rgba(255, 255, 255, 0.35);

        &:hover {
          color: rgba(255, 255, 255, 0.5);
        }

        &.active {
          color: rgba(255, 255, 255, 0.6);
        }
      }

      button {
        color: rgba(255, 255, 255, 0.54);
        background-color: #161616;

        &:hover {
          color: rgba(255, 255, 255, 0.65);
          background-color: #242424;
        }
      }
    }
  }

  // ---------------------------------------------
  // layout
  // ---------------------------------------------
  > section {
    position: relative;
    height: 84px;
    padding: 0 24px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    a {
      font-size: 16px;
      font-weight: 900;
    }

    svg {
      font-size: 32px;
    }
  }

  > nav {
    position: absolute;
    top: 84px;
    left: 0;
    width: 100vw;
    height: calc(100vh - 84px);

    display: flex;
    flex-direction: column;
    padding: 24px;

    a {
      margin-bottom: 12px;
    }

    button {
      margin-top: 30px;
    }

    animation: ${slide} 0.3s cubic-bezier(0.655, 1.075, 0.8, 0.995);
  }

  &[data-open='true'] {
    position: fixed;
    z-index: 10000;
    top: 0;
    width: 100vw;
  }
`;
