import { useState } from 'react';
import './App.css';
import { VirtualizedList } from './components/VirtualizedList/VirtualizedList';
import { Lookup } from './components/Lookup';

interface Fruit {
  name: string;
  color: string;
}

interface Country {
  id: number;
  name: string;
  code: string; 
}

function App() {

  const stringItems = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew'];
  const fruitItems: Fruit[] = [
    { name: 'Apple', color: 'Red' },
    { name: 'Banana', color: 'Yellow' },
    { name: 'Cherry', color: 'Red' },
    { name: 'Date', color: 'Brown' },
    { name: 'Elderberry', color: 'Purple' },
    { name: 'Fig', color: 'Green' },
    { name: 'Grape', color: 'Purple' },
    { name: 'Honeydew', color: 'Green' },
  ];

  const countryItems: Country[] = [
    { id: 1, name: 'United States', code: 'US' },
    { id: 2, name: 'Canada', code: 'CA' },
    { id: 3, name: 'Mexico', code: 'MX' },
    { id: 4, name: 'United Kingdom', code: 'UK' },
    { id: 5, name: 'France', code: 'FR' },
    { id: 6, name: 'Germany', code: 'DE' },
    { id: 7, name: 'Spain', code: 'ES' },
    { id: 8, name: 'Italy', code: 'IT' },
  ];

  const [stringSelected, setStringSelected] = useState<string>('Banana');
  const [stringMultipleSelected, setStringMultipleSelected] = useState<string[]>(['Apple', 'Cherry']);
  const [fruitSelected, setFruitSelected] = useState<Fruit>(fruitItems[1]);
  // Removed unused multiple select state from VirtualizedList-only demo

  // Lookup component state
  const [lookupStringCombobox, setLookupStringCombobox] = useState<string>('');
  const [lookupStringDropdown, setLookupStringDropdown] = useState<string>('');
  const [lookupFruitCombobox, setLookupFruitCombobox] = useState<Fruit | undefined>(undefined);
  const [lookupCountryMultiple, setLookupCountryMultiple] = useState<Country[]>([]);
  const [lookupAsyncCountry, setLookupAsyncCountry] = useState<Country | undefined>(undefined);

  // Simulate async API call
  const fetchCountriesAsync = async (searchText: string): Promise<Country[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = countryItems.filter(
          (c) =>
            c.name.toLowerCase().includes(searchText.toLowerCase()) ||
            c.code.toLowerCase().includes(searchText.toLowerCase())
        );
        resolve(filtered);
      }, 300);
    });
  };

  return (
    <>
      <h1>Virtualized List Examples</h1>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h2>String List (Single Select)</h2>
          <VirtualizedList
            items={stringItems}
            selected={stringSelected}
            onSelect={(selected) => setStringSelected(selected as string)}
            styles={{ border: '1px solid #ccc', width: '200px' }}
            showSeparator
          />
        </div>
        <div>
          <h2>String List (Multiple Select)</h2>
          <VirtualizedList
            items={stringItems}
            selected={stringMultipleSelected}
            onSelect={(selected) => setStringMultipleSelected(selected as string[])}
            multipleSelect={true}
            styles={{ border: '1px solid #ccc', width: '200px' }}
          />
        </div>
        <div>
          <h2>Object List (Single Select)</h2>
          <VirtualizedList<Fruit>
            items={fruitItems}
            selected={fruitSelected}
            itemKey="name"
            renderer={(item) => <div>{item.name} - {item.color}</div>}
            onSelect={(selected) => setFruitSelected(selected as Fruit)}
            styles={{ border: '1px solid #ccc', width: '250px' }}
          />
        </div>
        <div>
        </div>
      </div>
      <hr style={{ margin: '40px 0' }} />
      <h1>Lookup Component Examples</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>String Combobox (Type to Search)</h3>
          <Lookup<string>
            type="combobox"
            items={stringItems}
            selected={lookupStringCombobox}
            onSelect={(s) => setLookupStringCombobox(Array.isArray(s) ? (s[0] ?? '') : s)}
            placeholder="Type fruit name..."
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Selected: <strong>{lookupStringCombobox || 'None'}</strong>
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>String Dropdown (Click to View All)</h3>
          <Lookup<string>
            type="dropdown"
            items={stringItems}
            selected={lookupStringDropdown}
            onSelect={(s) => setLookupStringDropdown(Array.isArray(s) ? (s[0] ?? '') : s)}
            placeholder="Select a fruit..."
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Selected: <strong>{lookupStringDropdown || 'None'}</strong>
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>Object Combobox (Typed Items)</h3>
          <Lookup<Fruit>
            type="combobox"
            items={fruitItems}
            selected={lookupFruitCombobox}
            onSelect={(s) => setLookupFruitCombobox(Array.isArray(s) ? (s[0] ?? undefined) : s)}
            itemKey="name"
            matchFields={['name', 'color']}
            renderer={(fruit) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <span>{fruit.name}</span>
                <span style={{ color: '#666', fontSize: '12px' }}>({fruit.color})</span>
              </div>
            )}
            placeholder="Search by name or color..."
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Selected: <strong>{lookupFruitCombobox?.name || 'None'}</strong>
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>Multiple Select (Pills)</h3>
          <Lookup<Country>
            type="combobox"
            items={countryItems}
            selected={lookupCountryMultiple}
            onSelect={(s) => setLookupCountryMultiple(Array.isArray(s) ? s : (s ? [s] : []))}
            multipleSelect={true}
            itemKey="id"
            matchFields={['name', 'code']}
            renderer={(country) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <span>{country.name}</span>
                <span style={{ color: '#999', fontSize: '12px' }}>{country.code}</span>
              </div>
            )}
            placeholder="Select countries..."
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Selected ({lookupCountryMultiple.length}): <strong>
              {lookupCountryMultiple.map((c) => c.code).join(', ') || 'None'}
            </strong>
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>Async Callback (API Simulation)</h3>
          <Lookup<Country>
            type="combobox"
            items={fetchCountriesAsync}
            selected={lookupAsyncCountry}
            onSelect={(s) => setLookupAsyncCountry(Array.isArray(s) ? (s[0] ?? undefined) : s)}
            itemKey="id"
            renderer={(country) => (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <span>{country.name}</span>
                <span style={{ color: '#999', fontSize: '12px' }}>{country.code}</span>
              </div>
            )}
            placeholder="Type to search (simulates API call)..."
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Selected: <strong>{lookupAsyncCountry?.name || 'None'}</strong>
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>Dropdown Above Input</h3>
          <Lookup<string>
            type="dropdown"
            items={stringItems}
            selected={lookupStringDropdown}
            onSelect={(s) => setLookupStringDropdown(Array.isArray(s) ? (s[0] ?? '') : s)}
            dropdownPosition="above"
            placeholder="Dropdown shows above..."
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            (Opens dropdown above the input field)
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>Fixed Input Width (300px)</h3>
          <Lookup<string>
            type="combobox"
            items={stringItems}
            selected={lookupStringCombobox}
            onSelect={(s) => setLookupStringCombobox(Array.isArray(s) ? (s[0] ?? '') : s)}
            inputWidth={300}
            placeholder="Fixed width input..."
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            (Input has fixed width of 300px)
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>Auto Width with Fixed Dropdown (350px)</h3>
          <Lookup<string>
            type="combobox"
            items={stringItems}
            selected={lookupStringCombobox}
            onSelect={(s) => setLookupStringCombobox(Array.isArray(s) ? (s[0] ?? '') : s)}
            inputWidth="auto"
            dropdownWidth={350}
            placeholder="Auto input, fixed dropdown..."
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            (Input adjusts to content, dropdown is 350px)
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>Hidden Magnifying Glass</h3>
          <Lookup<string>
            type="combobox"
            items={stringItems}
            selected={lookupStringCombobox}
            onSelect={(s) => setLookupStringCombobox(Array.isArray(s) ? (s[0] ?? '') : s)}
            hideMagnifyingGlass={true}
            placeholder="No magnifying glass icon..."
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            (Magnifying glass icon is hidden)
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>Auto Sizing input</h3>
          <Lookup<string>
            type="dropdown"
            items={stringItems}
            selected={lookupStringDropdown}
            onSelect={(s) => setLookupStringDropdown(Array.isArray(s) ? (s[0] ?? '') : s)}
            inputWidth="auto"
            dropdownWidth="auto"
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            (Dropdown input and list adjust to content size)
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>List with Separators and Limited Height</h3>
          <Lookup<string>
            type="dropdown"
            items={stringItems}
            selected={lookupStringDropdown}
            onSelect={(s) => setLookupStringDropdown(Array.isArray(s) ? (s[0] ?? '') : s)}
            showSeparator={true}
            maxHeight={150}
            placeholder="Separators between items..."
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            (Shows horizontal separators, max height 150px)
          </p>
        </div>

        <div style={{ border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px' }}>
          <h3>Auto-Position Dropdown</h3>
          <Lookup<string>
            type="combobox"
            items={stringItems}
            selected={lookupStringCombobox}
            onSelect={(s) => setLookupStringCombobox(Array.isArray(s) ? (s[0] ?? '') : s)}
            dropdownPosition="auto"
            placeholder="Auto-positioned dropdown..."
            maxHeight={80}
            dropdownWidth={140}
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            (Dropdown automatically positions based on available space: below → right → left → above)
          </p>
        </div>
      </div>
    </>
  )
}

export default App
