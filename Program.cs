using Microsoft.EntityFrameworkCore;
using MyMvcProject.Data;
using MyMvcProject.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddMemoryCache();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Khởi tạo Database và Seed dữ liệu
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    using (var context = services.GetRequiredService<ApplicationDbContext>())
    {
        context.Database.OpenConnection();
        try {
            // Tạo bảng Classrooms nếu chưa có
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Classrooms"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""Name"" TEXT NOT NULL
                );
            ");
            // Tạo bảng Students nếu chưa có
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""Students"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""Name"" TEXT NOT NULL,
                    ""Stickers"" INTEGER DEFAULT 0,
                    ""ClassroomId"" INTEGER DEFAULT 0
                );
            ");
            // Tạo bảng GroupSettings nếu chưa có
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""GroupSettings"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""Name"" TEXT NOT NULL,
                    ""Probability"" DOUBLE PRECISION DEFAULT 0,
                    ""Color"" TEXT NOT NULL DEFAULT '#6c757d'
                );
            ");

            // MIGRATE: Thêm cột Name và Color nếu bảng cũ chưa có
            context.Database.ExecuteSqlRaw(@"
                ALTER TABLE ""GroupSettings"" ADD COLUMN IF NOT EXISTS ""Name"" TEXT NOT NULL DEFAULT 'Nhóm quà';
                ALTER TABLE ""GroupSettings"" ADD COLUMN IF NOT EXISTS ""Color"" TEXT NOT NULL DEFAULT '#6c757d';
            ");

            // Seed hoặc Cập nhật 3 nhóm quà mặc định theo tỉ lệ yêu cầu
            context.Database.ExecuteSqlRaw(@"
                -- Xóa các nhóm thừa nếu có
                DELETE FROM ""GroupSettings"" WHERE ""Id"" > 3;

                -- Cập nhật hoặc thêm mới 3 nhóm chuẩn
                INSERT INTO ""GroupSettings"" (""Id"", ""Name"", ""Probability"", ""Color"") 
                VALUES (1, 'Quà Nhỏ', 60, '#6c757d'), 
                       (2, 'Quà Lớn', 35, '#22c55e'), 
                       (3, 'Quà VIP', 5, '#ef4444')
                ON CONFLICT (""Id"") DO UPDATE 
                SET ""Name"" = EXCLUDED.""Name"", 
                    ""Probability"" = EXCLUDED.""Probability"", 
                    ""Color"" = EXCLUDED.""Color"";
            ");
            context.SaveChanges();
        } finally {
            context.Database.CloseConnection();
        }
    }
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.MapControllers();

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Run($"http://0.0.0.0:{port}");
