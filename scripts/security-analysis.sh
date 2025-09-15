#!/bin/bash

# PoEP Security Analysis Script
# Runs various security checks on the smart contracts

echo "🛡️  PoEP Security Analysis"
echo "========================="

# Check if we're in the right directory
if [ ! -f "contracts/PoEP.sol" ]; then
    echo "❌ Error: Not in the correct directory. Please run from project root."
    exit 1
fi

echo "📁 Project directory: $(pwd)"
echo "📅 Analysis date: $(date)"
echo ""

# 1. Basic contract analysis
echo "🔍 1. Basic Contract Analysis"
echo "-----------------------------"

echo "📄 Contract files found:"
find contracts -name "*.sol" -type f | while read file; do
    lines=$(wc -l < "$file")
    echo "   - $file ($lines lines)"
done

echo ""

# 2. Check for common vulnerabilities
echo "🚨 2. Security Pattern Analysis"
echo "--------------------------------"

echo "✅ Checking for security patterns..."

# Check for reentrancy protection
if grep -q "ReentrancyGuard" contracts/*.sol; then
    echo "✅ Reentrancy protection: FOUND"
else
    echo "❌ Reentrancy protection: NOT FOUND"
fi

# Check for access control
if grep -q "onlyOwner\|AccessControl" contracts/*.sol; then
    echo "✅ Access control: FOUND"
else
    echo "❌ Access control: NOT FOUND"
fi

# Check for safe math (Solidity 0.8+ has built-in overflow protection)
if grep -q "pragma solidity \^0\.8" contracts/*.sol; then
    echo "✅ Overflow protection: BUILT-IN (Solidity 0.8+)"
else
    echo "⚠️  Overflow protection: CHECK MANUALLY"
fi

# Check for proper input validation
if grep -q "require\|revert" contracts/*.sol; then
    echo "✅ Input validation: FOUND"
else
    echo "❌ Input validation: NOT FOUND"
fi

echo ""

# 3. Check for hardcoded values
echo "🔧 3. Configuration Analysis"
echo "----------------------------"

echo "🔍 Checking for hardcoded values..."

# Check for hardcoded addresses
hardcoded_addresses=$(grep -n "0x[a-fA-F0-9]\{40\}" contracts/*.sol | wc -l)
if [ "$hardcoded_addresses" -gt 0 ]; then
    echo "⚠️  Found $hardcoded_addresses hardcoded addresses - review carefully"
    grep -n "0x[a-fA-F0-9]\{40\}" contracts/*.sol | head -3
else
    echo "✅ No suspicious hardcoded addresses found"
fi

echo ""

# 4. Function visibility analysis
echo "👁️  4. Function Visibility Analysis"
echo "------------------------------------"

echo "🔍 Checking function visibility..."

public_functions=$(grep -c "function.*public" contracts/*.sol)
external_functions=$(grep -c "function.*external" contracts/*.sol)
internal_functions=$(grep -c "function.*internal" contracts/*.sol)
private_functions=$(grep -c "function.*private" contracts/*.sol)

echo "📊 Function visibility breakdown:"
echo "   - Public functions: $public_functions"
echo "   - External functions: $external_functions"
echo "   - Internal functions: $internal_functions"
echo "   - Private functions: $private_functions"

echo ""

# 5. Event analysis
echo "📡 5. Event Analysis"
echo "-------------------"

event_count=$(grep -c "event " contracts/*.sol)
emit_count=$(grep -c "emit " contracts/*.sol)

echo "📊 Event usage:"
echo "   - Events defined: $event_count"
echo "   - Events emitted: $emit_count"

if [ "$event_count" -gt 0 ] && [ "$emit_count" -gt 0 ]; then
    echo "✅ Events are properly used for transparency"
else
    echo "⚠️  Consider adding more events for better transparency"
fi

echo ""

# 6. Gas optimization analysis
echo "⛽ 6. Gas Optimization Analysis"
echo "-------------------------------"

echo "🔍 Checking for gas optimization opportunities..."

# Check for loops
loop_count=$(grep -c "for\|while" contracts/*.sol)
if [ "$loop_count" -gt 0 ]; then
    echo "⚠️  Found $loop_count loops - check for gas limit issues"
else
    echo "✅ No loops found - good for gas optimization"
fi

# Check for storage operations
storage_ops=$(grep -c "storage\|mapping" contracts/*.sol)
echo "📊 Storage operations: $storage_ops"

echo ""

# 7. External dependency analysis
echo "🔗 7. External Dependency Analysis"
echo "-----------------------------------"

echo "📦 Checking external dependencies..."

# Check imports
imports=$(grep -c "import " contracts/*.sol)
echo "📊 Import statements: $imports"

# Check OpenZeppelin usage
oz_imports=$(grep -c "@openzeppelin" contracts/*.sol)
if [ "$oz_imports" -gt 0 ]; then
    echo "✅ Using OpenZeppelin ($oz_imports imports) - good security practice"
else
    echo "⚠️  No OpenZeppelin usage found - consider using battle-tested libraries"
fi

echo ""

# 8. Run Slither if available
echo "🐍 8. Slither Analysis"
echo "----------------------"

if command -v slither &> /dev/null; then
    echo "🔍 Running Slither analysis..."

    cd contracts
    slither . --print human-summary 2>/dev/null || echo "⚠️  Slither analysis failed - check contract syntax"
    cd ..
else
    echo "⚠️  Slither not installed. To install:"
    echo "      pip install slither-analyzer"
    echo "      Then run: slither contracts/"
fi

echo ""

# 9. Final security checklist
echo "📋 9. Security Checklist"
echo "------------------------"

echo "Manual review required for:"
echo "   [ ] ZK proof verification logic correctness"
echo "   [ ] Nullifier uniqueness enforcement"
echo "   [ ] Soul-bound transfer restrictions"
echo "   [ ] Trust score update authorization"
echo "   [ ] Contract upgrade mechanisms (if any)"
echo "   [ ] Emergency pause functionality"
echo "   [ ] Gas limit considerations for complex operations"
echo "   [ ] Front-running protection for sensitive operations"

echo ""

# 10. Recommendations
echo "💡 10. Security Recommendations"
echo "--------------------------------"

echo "✅ Immediate actions:"
echo "   1. Run full Slither analysis: slither contracts/"
echo "   2. Consider formal verification of ZK circuit"
echo "   3. Audit ZK proof generation and verification logic"
echo "   4. Test with edge cases and malformed inputs"
echo "   5. Gas optimization review for production deployment"

echo ""
echo "🔒 Advanced security measures:"
echo "   1. Bug bounty program after mainnet launch"
echo "   2. Time-locked upgrades (if upgradeable)"
echo "   3. Multi-sig wallet for contract ownership"
echo "   4. Circuit parameter ceremony documentation"
echo "   5. External security audit by reputable firm"

echo ""
echo "🎉 Security analysis complete!"
echo "📊 Summary: Review the findings above and address any ⚠️  warnings"
echo "💎 For production deployment, consider professional audit"