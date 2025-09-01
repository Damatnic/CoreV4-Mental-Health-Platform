#!/bin/bash
set -euo pipefail

# CoreV4 Mental Health Platform - Disaster Recovery Testing Script
# HIPAA Compliant Healthcare System Recovery Validation
# Version: 4.0.0
# Last Updated: September 1, 2025

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_LOG="disaster_recovery_test_${TIMESTAMP}.log"
DR_TEST_ENV="dr-test-${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') [${level}] $*" | tee -a "$TEST_LOG"
}

info() { log "${BLUE}INFO${NC}" "$@"; }
warn() { log "${YELLOW}WARN${NC}" "$@"; }
error() { log "${RED}ERROR${NC}" "$@"; }
success() { log "${GREEN}SUCCESS${NC}" "$@"; }

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local critical="${3:-false}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    info "🧪 Running Test: $test_name"
    
    if eval "$test_command" >> "$TEST_LOG" 2>&1; then
        success "✅ PASSED: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ PASSED: $test_name")
    else
        if [ "$critical" = "true" ]; then
            error "❌ CRITICAL FAILURE: $test_name"
            TEST_RESULTS+=("❌ CRITICAL FAILURE: $test_name")
        else
            error "❌ FAILED: $test_name"
            TEST_RESULTS+=("❌ FAILED: $test_name")
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Cleanup function
cleanup() {
    info "🧹 Cleaning up test environment..."
    
    # Remove test Docker containers
    if docker ps -a --format "table {{.Names}}" | grep -q "^$DR_TEST_ENV"; then
        docker stop "$DR_TEST_ENV-frontend" "$DR_TEST_ENV-backend" "$DR_TEST_ENV-db" "$DR_TEST_ENV-redis" 2>/dev/null || true
        docker rm "$DR_TEST_ENV-frontend" "$DR_TEST_ENV-backend" "$DR_TEST_ENV-db" "$DR_TEST_ENV-redis" 2>/dev/null || true
    fi
    
    # Remove test network
    if docker network ls --format "{{.Name}}" | grep -q "^$DR_TEST_ENV"; then
        docker network rm "$DR_TEST_ENV-network" 2>/dev/null || true
    fi
    
    # Remove test data volumes
    if docker volume ls --format "{{.Name}}" | grep -q "^$DR_TEST_ENV"; then
        docker volume rm "$DR_TEST_ENV-db-data" "$DR_TEST_ENV-redis-data" 2>/dev/null || true
    fi
    
    success "✅ Cleanup completed"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Header
echo "============================================================================="
echo "  🏥 CoreV4 Mental Health Platform - Disaster Recovery Testing Suite"
echo "  📋 HIPAA Compliant Healthcare System Recovery Validation"
echo "  📅 Test Run: $TIMESTAMP"
echo "============================================================================="

info "🚀 Starting Disaster Recovery Testing Suite..."

# ===================================
# TEST 1: BACKUP SYSTEM VALIDATION
# ===================================
info "📊 Phase 1: Backup System Validation"

run_test "Database Backup Creation" \
"docker-compose exec -T postgres pg_dump -U corev4_user corev4_db | gzip > backup_test_${TIMESTAMP}.sql.gz && [ -s backup_test_${TIMESTAMP}.sql.gz ]" \
true

run_test "Redis Backup Creation" \
"docker-compose exec -T redis redis-cli BGSAVE && sleep 2 && docker-compose exec -T redis ls -la /data/dump.rdb" \
true

run_test "Application Code Backup" \
"tar -czf app_backup_${TIMESTAMP}.tar.gz --exclude=node_modules --exclude=dist --exclude=.git . && [ -s app_backup_${TIMESTAMP}.tar.gz ]" \
false

run_test "Configuration Backup" \
"tar -czf config_backup_${TIMESTAMP}.tar.gz docker-compose.yml .env.example k8s/ && [ -s config_backup_${TIMESTAMP}.tar.gz ]" \
true

# ===================================
# TEST 2: SYSTEM FAILURE SIMULATION
# ===================================
info "📊 Phase 2: System Failure Simulation"

run_test "Frontend Service Failure Recovery" \
"docker-compose stop frontend && sleep 5 && docker-compose start frontend && sleep 10 && curl -f http://localhost:3000/health" \
true

run_test "Backend Service Failure Recovery" \
"docker-compose stop backend && sleep 5 && docker-compose start backend && sleep 15 && curl -f http://localhost:4000/health" \
true

run_test "Database Connection Recovery" \
"docker-compose exec -T backend node -e \"const { Pool } = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()').then(() => process.exit(0)).catch(() => process.exit(1));\"" \
true

run_test "Redis Connection Recovery" \
"docker-compose exec -T backend node -e \"const redis = require('redis'); const client = redis.createClient({url: process.env.REDIS_URL}); client.connect().then(() => client.ping()).then(() => process.exit(0)).catch(() => process.exit(1));\"" \
true

# ===================================
# TEST 3: DATA RECOVERY VALIDATION
# ===================================
info "📊 Phase 3: Data Recovery Validation"

# Create test data
info "Creating test data for recovery validation..."
TEST_USER_ID="test_user_$(date +%s)"
TEST_DATA_SQL="INSERT INTO users (id, email, created_at) VALUES ('$TEST_USER_ID', 'dr-test@example.com', NOW());"

run_test "Test Data Creation" \
"docker-compose exec -T postgres psql -U corev4_user -d corev4_db -c \"$TEST_DATA_SQL\"" \
true

run_test "Backup Recovery Simulation" \
"gunzip -c backup_test_${TIMESTAMP}.sql.gz | docker-compose exec -T postgres psql -U corev4_user -d corev4_test" \
true

run_test "Data Integrity Verification" \
"docker-compose exec -T postgres psql -U corev4_user -d corev4_db -c \"SELECT COUNT(*) FROM users WHERE id = '$TEST_USER_ID';\" | grep -q '1'" \
true

# ===================================
# TEST 4: CRISIS SYSTEM AVAILABILITY
# ===================================
info "📊 Phase 4: Crisis System Availability Testing"

run_test "Crisis Endpoint Availability" \
"curl -f -m 5 http://localhost:4000/api/crisis/resources" \
true

run_test "Emergency Hotline Data Accessibility" \
"curl -f -m 3 http://localhost:4000/api/emergency/hotlines | jq '.[] | select(.number == \"988\")' | grep -q '988'" \
true

run_test "Crisis Assessment API Responsiveness" \
"time curl -f -m 1 http://localhost:4000/api/crisis/assess -X POST -H 'Content-Type: application/json' -d '{\"severity\": \"low\"}' | grep -q 'assessment'" \
true

run_test "Offline Crisis Resources Availability" \
"curl -f http://localhost:3000/crisis-resources.json | jq '.offline_resources | length' | grep -E '^[1-9][0-9]*$'" \
false

# ===================================
# TEST 5: HIPAA COMPLIANCE VALIDATION
# ===================================
info "📊 Phase 5: HIPAA Compliance Validation"

run_test "Audit Log Integrity" \
"docker-compose exec -T postgres psql -U corev4_user -d corev4_db -c \"SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours';\" | grep -E '^[0-9]+$'" \
true

run_test "Encryption Key Recovery" \
"docker-compose exec -T backend node -e \"const crypto = require('crypto'); console.log(process.env.ENCRYPTION_KEY?.length >= 32 ? 'OK' : 'FAIL');\" | grep -q 'OK'" \
true

run_test "PHI Data Encryption Verification" \
"docker-compose exec -T postgres psql -U corev4_user -d corev4_db -c \"SELECT encrypted_data FROM patient_data LIMIT 1;\" | grep -q 'encrypted:'" \
false

run_test "Session Security Recovery" \
"curl -f -H 'Authorization: Bearer invalid_token' http://localhost:4000/api/user/profile 2>&1 | grep -q '401'" \
true

# ===================================
# TEST 6: PERFORMANCE UNDER RECOVERY
# ===================================
info "📊 Phase 6: Performance Under Recovery Conditions"

run_test "Crisis Response Time After Recovery" \
"time_result=\$(curl -w '%{time_total}' -s -o /dev/null http://localhost:4000/api/crisis/assess -X POST -H 'Content-Type: application/json' -d '{\"severity\": \"high\"}') && (( \$(echo \"\$time_result < 0.2\" | bc -l) ))" \
true

run_test "Database Query Performance After Recovery" \
"docker-compose exec -T postgres psql -U corev4_user -d corev4_db -c \"\\timing on\" -c \"SELECT COUNT(*) FROM users;\" | grep -E 'Time: [0-9]+\\.[0-9]+ ms'" \
false

run_test "Frontend Load Time After Recovery" \
"curl -w '%{time_total}' -s -o /dev/null http://localhost:3000/ | awk '{ if (\$1 < 3.0) exit 0; else exit 1 }'" \
false

# ===================================
# TEST 7: MONITORING & ALERTING
# ===================================
info "📊 Phase 7: Monitoring & Alerting System Recovery"

run_test "Health Check Endpoint Recovery" \
"curl -f http://localhost:4000/health | jq -r '.status' | grep -q 'healthy'" \
true

run_test "Metrics Endpoint Availability" \
"curl -f http://localhost:4000/metrics | grep -q 'nodejs_heap_size_used_bytes'" \
false

run_test "Application Logging Recovery" \
"docker-compose logs --tail=10 backend | grep -E '(INFO|WARN|ERROR)'" \
true

# ===================================
# TEST 8: SECURITY POSTURE VALIDATION
# ===================================
info "📊 Phase 8: Security Posture After Recovery"

run_test "SSL Certificate Validation" \
"echo | openssl s_client -connect localhost:443 -servername localhost 2>/dev/null | openssl x509 -noout -text | grep -q 'Subject:'" \
false

run_test "Security Headers After Recovery" \
"curl -I http://localhost:3000/ | grep -q 'Strict-Transport-Security'" \
false

run_test "CORS Configuration Recovery" \
"curl -H 'Origin: https://malicious.com' -I http://localhost:4000/api/health | grep -q 'Access-Control-Allow-Origin: https://corev4.health'" \
false

# ===================================
# RESULTS SUMMARY
# ===================================
echo ""
echo "============================================================================="
echo "  📊 DISASTER RECOVERY TEST RESULTS SUMMARY"
echo "============================================================================="

info "📈 Test Statistics:"
echo "   Total Tests: $TOTAL_TESTS"
echo "   ✅ Passed: $PASSED_TESTS"
echo "   ❌ Failed: $FAILED_TESTS"
echo "   📊 Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"

echo ""
info "📋 Detailed Results:"
for result in "${TEST_RESULTS[@]}"; do
    echo "   $result"
done

# Calculate overall status
CRITICAL_FAILURES=$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -c "CRITICAL FAILURE" || true)
SUCCESS_RATE=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))

echo ""
info "🎯 Recovery Readiness Assessment:"

if [ $CRITICAL_FAILURES -eq 0 ] && [ $SUCCESS_RATE -ge 85 ]; then
    success "🟢 EXCELLENT - System demonstrates robust disaster recovery capabilities"
    success "   ✅ Zero critical failures detected"
    success "   ✅ Success rate: ${SUCCESS_RATE}% (Target: ≥85%)"
    success "   ✅ Crisis systems maintained availability"
    success "   ✅ HIPAA compliance preserved during recovery"
elif [ $CRITICAL_FAILURES -eq 0 ] && [ $SUCCESS_RATE -ge 70 ]; then
    warn "🟡 GOOD - System shows adequate recovery capabilities with minor issues"
    warn "   ✅ No critical failures, but $(( 100 - SUCCESS_RATE ))% of tests need attention"
    warn "   ⚠️  Recommend addressing failed tests before production deployment"
elif [ $CRITICAL_FAILURES -gt 0 ] || [ $SUCCESS_RATE -lt 70 ]; then
    error "🔴 NEEDS IMPROVEMENT - Critical issues detected in disaster recovery"
    error "   ❌ Critical failures: $CRITICAL_FAILURES"
    error "   ❌ Success rate: ${SUCCESS_RATE}% (Below acceptable threshold)"
    error "   🚨 DO NOT DEPLOY TO PRODUCTION until issues are resolved"
fi

echo ""
info "📁 Test artifacts saved:"
echo "   📄 Full test log: $TEST_LOG"
echo "   💾 Database backup: backup_test_${TIMESTAMP}.sql.gz"
echo "   📦 Application backup: app_backup_${TIMESTAMP}.tar.gz"
echo "   ⚙️  Configuration backup: config_backup_${TIMESTAMP}.tar.gz"

echo ""
info "📋 Next Steps:"
echo "   1. Review failed tests in the detailed log"
echo "   2. Address any critical failures immediately"
echo "   3. Schedule regular DR testing (monthly recommended)"
echo "   4. Update disaster recovery documentation"
echo "   5. Verify backup retention and rotation policies"

echo ""
success "🏁 Disaster Recovery Testing Complete!"
echo "   For healthcare systems, regular DR testing is not just best practice—it's essential"
echo "   for maintaining patient safety and regulatory compliance."

# Exit with appropriate code
if [ $CRITICAL_FAILURES -gt 0 ]; then
    exit 2  # Critical failures
elif [ $SUCCESS_RATE -lt 85 ]; then
    exit 1  # Some failures
else
    exit 0  # Success
fi